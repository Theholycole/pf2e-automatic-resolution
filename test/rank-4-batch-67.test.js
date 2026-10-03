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


// Rank 4, batch 67 (2026-10-02): Seal Fate (Fortitude: PF2e's Effect giving weakness to the caster's chosen type at floor(rank/2) — until the end of
// the caster's next turn / 1 minute / unlimited; the death rule (level 7 or less, +4 every 2 ranks) a note).

test("Seal Fate: the chosen weakness for each result's time", async () => {
    const { inspectSavePlan, executableCasterChoice } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/seal-fate"));
    const rule = d => plan.resolution.outcomes[d].nativeEffects[0].outcomeRule;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [rule(d).kind, rule(d).durationOverride ?? null]),
        [["chosen-weakness-effect", { value: 1, unit: "rounds", expiry: "turn-end" }], ["chosen-weakness-effect", { value: 1, unit: "minutes", expiry: null }], ["chosen-weakness-effect", null]]);
    assert.equal(plan.resolution.casterChoice.flag, "damageType");
    assert.equal(plan.resolution.casterChoice.values.length, 9);
    assert.equal(executableCasterChoice(plan), true);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.rankAmount.base, n.rankAmount.step])), [[["Sealed fate", 7, 4]], [["Sealed fate", 7, 4]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another list isn't read.
    const other = compile(withText(await spell("rank-4/seal-fate"), html => html.replace("sonic, or void", "sonic, void, or force")));
    assert.equal(other.compilerEvidence.chosenWeakness, undefined);
});
