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


// Rank 4, batch 65 (2026-10-02): Delusional Pride (Will, then immune for 24 hours: for 1 round / 10 minutes / 24 hours, each failed attack roll or
// skill check gives a −1 status penalty to both until the end of its turn, −2 on a second failure — the GM's control).

test("Delusional Pride: the overconfidence notes", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/delusional-pride"));
    const notes = d => plan.resolution.outcomes[d].noteEffects;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [notes(d)[0].duration.value, notes(d)[0].duration.unit, notes(d)[0].triggeredPenalty.values]),
        [[1, "rounds", [-1, -2]], [10, "minutes", [-1, -2]], [24, "hours", [-1, -2]]]);
    assert.ok(["success", "failure", "criticalFailure"].every(d => notes(d).every(validNoteEffect)));
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 24, unit: "hours" });
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another penalized roll isn't read.
    const other = compile(withText(await spell("rank-4/delusional-pride"), html => html.replace("penalty to attack rolls and skill checks until", "penalty to Strikes until")));
    assert.equal(other.compilerEvidence.overconfidence, undefined);
});
