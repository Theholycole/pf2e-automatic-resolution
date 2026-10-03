import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 4, batch 70 (2026-10-02): Compel True Name (Will: immunity to this caster's castings — 1 week / 1 day / 1 hour / none; a Compelled note for
// 10 minutes / 8 hours; what the target learns a card reminder).

test("Compel True Name: each result's immunity to this caster, and the obedience note", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/compel-true-name"));
    const immunity = plan.resolution.temporaryImmunity;
    assert.equal(immunity.byCaster, true);
    assert.deepEqual(immunity.degrees, ["criticalSuccess", "success", "failure"]);
    assert.deepEqual(immunity.byDegree, { criticalSuccess: { value: 7, unit: "days" }, success: { value: 1, unit: "days" }, failure: { value: 1, unit: "hours" } });
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])),
        [[["Compelled", 10, "minutes"]], [["Compelled", 8, "hours"]]]);
    assert.deepEqual(["criticalSuccess", "success"].map(d => plan.resolution.outcomes[d].noteEffects ?? []), [[], []]);
    assert.ok(plan.resolution.reminders.some(r => /learns the caster's true name/.test(r.text)));
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // A per-result immunity outside the listed results is refused.
    const bad = structuredClone(plan); bad.resolution.temporaryImmunity.byDegree.criticalFailure = { value: 1, unit: "hours" };
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => b.code === "temporary-immunity" || /Temporary immunity/.test(b.message)));
    // Another learning wording isn't read.
    const other = compile(withText(await spell("rank-4/compel-true-name"), html => html.replace("learns a fragment of your true name", "learns your name")));
    assert.equal(other.compilerEvidence.trueNameCommand, undefined);
});
