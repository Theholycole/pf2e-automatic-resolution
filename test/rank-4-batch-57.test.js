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


// Rank 4, batch 57 (2026-10-02): Outcast's Curse (Will: PF2e's Effects rolling Deception, Diplomacy, Intimidation and Performance twice keeping the
// worse — 10 minutes on a success, for good on a failure; initial attitudes one step worse, two on a critical failure, as notes).

test("Outcast's Curse: the skills rolled twice and the attitudes", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/outcasts-curse"));
    const native = d => plan.resolution.outcomes[d].nativeEffects.map(e => [e.outcomeRule.kind, e.document.mechanics.duration.unit]);
    assert.deepEqual([native("success"), native("failure"), native("criticalFailure")],
        [[["skill-roll-twice-effect", "minutes"]], [["skill-roll-twice-effect", "unlimited"]], [["skill-roll-twice-effect", "unlimited"]]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.mode, /two steps/.test(n.text)])),
        [[["Initial attitudes", "fixed", false]], [["Initial attitudes", "unlimited", false]], [["Initial attitudes", "unlimited", true]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Other skills aren't read.
    const other = compile(withText(await spell("rank-4/outcasts-curse"), html => html.replace("Intimidation, or Performance check", "or Intimidation check")));
    assert.equal(other.compilerEvidence.skillRollTwice, undefined);
});
