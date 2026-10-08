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


// Rank 9, batch 8 (2026-10-05): the end of feature group 3 — Burning Blossoms (a card: the petals' area, the enemies' save pressed again), Unfathomable
// Song (lingering targets, a table read by degree), Dread Mosquito Storm (lingering exposures with their damage, the disease handed off).
import { inspectIncarnatePlan, isExecutableLingeringPlan, targetOutcomeConditions } from "../scripts/basic-save-core.js";

test("Burning Blossoms: the petals' area (6d6 + 1d6 a rank at turn end), the save with 24-hour immunity, Fascinated and the move-toward note", async () => {
    const plan = compile(await spell("rank-8/burning-blossoms"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [tree, gaze] = plan.resolution.incarnate.phases;
    assert.deepEqual([tree.kind, tree.events, tree.formula, tree.type, tree.rounds, tree.place], ["hazard", ["turn-end"], "(6+1*(@item.rank - 8))d6", "fire", 10, { type: "burst", value: 30 }]);
    assert.deepEqual([gaze.kind, gaze.traits, !!gaze.repeat], ["save", ["emotion", "mental", "visual"], true]);
    assert.deepEqual(gaze.plan.resolution.temporaryImmunity.duration, { value: 24, unit: "hours" });
    assert.deepEqual(["failure", "criticalFailure"].map(d => gaze.plan.resolution.outcomes[d].noteEffects.at(-1).label), ["Drawn to the tree", "Drawn to the tree"]);
});

test("Unfathomable Song: up to 5 targets saving when cast and on each Sustain; a failure's result and a critical failure's one higher", async () => {
    const plan = compile(await spell("rank-9/unfathomable-song"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.centre, plan.resolution.lingering.maxTargets.count, plan.resolution.lingering.events, plan.resolution.conditionRoll.criticalOffset], ["targets", 5, ["sustain"], 1]);
    const state = { outcomes: plan.resolution.outcomes, conditionRoll: { ...plan.resolution.conditionRoll, rolled: 4 } };
    const conditions = degree => targetOutcomeConditions(state, { degree }).map(c => [c.slug, c.value ?? null]);
    assert.deepEqual(conditions("failure"), [["blinded", null]]);
    assert.deepEqual(conditions("criticalFailure"), [["stunned", null], ["stupefied", 1]]);
    state.conditionRoll.rolled = 1;
    assert.deepEqual([conditions("failure"), conditions("criticalFailure")], [[["frightened", 2]], [["confused", null]]]);
});

test("Dread Mosquito Storm: entering and turn-start exposures, 1 void damage each, the disease's stages handed off, the success's recovery note", async () => {
    const plan = compile(await spell("rank-9/dread-mosquito-storm"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([[...plan.resolution.lingering.events].sort(), plan.resolution.lingering.exposureDamage.formula, plan.resolution.lingering.exposureDamage.type], [["enter", "turn-start"], "1", "void"]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].affliction?.stage), [1, 1, 2]);
    assert.equal(plan.resolution.outcomes.success.noteEffects.at(-1).label, "Recovering");
});
