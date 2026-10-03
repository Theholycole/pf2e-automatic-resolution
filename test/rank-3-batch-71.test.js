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


// Rank 3, batch 71 (2026-10-02): Shift Blame (Will, a reaction: every result immune for 24 hours; a failure — and so a critical failure — leaves a
// Shifted blame note (the GM's memory); the trigger's target and what the target notices a reminder).

test("Shift Blame: the 24-hour immunity for every result and the failure's memory note", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/shift-blame"));
    assert.deepEqual([plan.resolution.temporaryImmunity.degrees.length, plan.resolution.temporaryImmunity.duration], [4, { value: 24, unit: "hours" }]);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(d => (plan.resolution.outcomes[d].noteEffects ?? []).map(n => n.label)), [[], [], ["Shifted blame"], ["Shifted blame"]]);
    assert.equal(plan.targeting.actorConstraints.complete, true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another immunity time isn't read.
    const other = compile(withText(await spell("rank-3/shift-blame"), html => html.replace("temporarily immune for 24 hours", "temporarily immune for 1 week")));
    assert.equal(other.compilerEvidence.blameShift, undefined);
});
