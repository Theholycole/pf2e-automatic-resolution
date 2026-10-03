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


// Rank 4, batch 62 (2026-10-02): Daydreamer's Curse (Will: Medicine, Nature, Perception and Survival rolled twice keeping the worse; a concentrate
// action's critical success at Perception or a skill a success — 10 minutes or permanently; a critical failure: every concentrate check one degree
// worse instead).

test("Daydreamer's Curse: the generated curse Effects", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/daydreamers-curse"));
    const notes = d => plan.resolution.outcomes[d].noteEffects;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [notes(d)[0].duration.mode, notes(d)[0].rules.map(rule => `${rule.key}:${JSON.stringify(rule.adjustment ?? rule.selector)}`)]),
        [["fixed", ['RollTwice:["medicine","nature","perception","survival"]', 'AdjustDegreeOfSuccess:{"criticalSuccess":"to-success"}', 'AdjustDegreeOfSuccess:{"criticalSuccess":"to-success"}']],
         ["unlimited", ['RollTwice:["medicine","nature","perception","survival"]', 'AdjustDegreeOfSuccess:{"criticalSuccess":"to-success"}', 'AdjustDegreeOfSuccess:{"criticalSuccess":"to-success"}']],
         ["unlimited", ['RollTwice:["medicine","nature","perception","survival"]', 'AdjustDegreeOfSuccess:{"all":"one-degree-worse"}']]]);
    assert.ok(["success", "failure", "criticalFailure"].every(d => notes(d).every(validNoteEffect)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another trait isn't read.
    const other = compile(withText(await spell("rank-4/daydreamers-curse"), html => html.replace("with the concentrate trait as one degree", "with the manipulate trait as one degree")));
    assert.equal(other.compilerEvidence.skillCurse, undefined);
});
