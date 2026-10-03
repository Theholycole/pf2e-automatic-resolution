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


// Rank 4, batch 59 (2026-10-02): Clownish Curse (Will: Acrobatics, Stealth and Thievery rolled twice keeping the worse, and a failure at one a
// critical failure — for 1 round, 1 hour, or permanently).

test("Clownish Curse: the generated curse Effects", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/clownish-curse"));
    const notes = d => plan.resolution.outcomes[d].noteEffects;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [notes(d)[0].duration.mode, notes(d)[0].duration.value ?? null, notes(d)[0].duration.unit ?? null]),
        [["fixed", 1, "rounds"], ["fixed", 1, "hours"], ["unlimited", null, null]]);
    assert.deepEqual(notes("success")[0].rules.map(rule => [rule.key, rule.selector]), [["RollTwice", ["acrobatics", "stealth", "thievery"]], ["AdjustDegreeOfSuccess", "acrobatics"], ["AdjustDegreeOfSuccess", "stealth"], ["AdjustDegreeOfSuccess", "thievery"]]);
    assert.ok(["success", "failure", "criticalFailure"].every(d => notes(d).every(validNoteEffect)));
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another adjustment isn't read.
    const other = compile(withText(await spell("rank-4/clownish-curse"), html => html.replace("it gets a critical failure instead", "it falls prone")));
    assert.equal(other.compilerEvidence.skillCurse, undefined);
});
