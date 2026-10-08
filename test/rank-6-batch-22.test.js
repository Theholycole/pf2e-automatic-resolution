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


// Rank 6, batch 22 (2026-10-05): feature group 4, part 2 — Calcification, Vitrifying Blast (Slowed escalating, a weakness note following it),
// Chrysopoetic Curse (keyed GM questions), Dread Secret.
import { inspectIncarnatePlan, gmQuestionGates, gateAnswerFor } from "../scripts/basic-save-core.js";
import { validNoteEffect } from "../scripts/note-effects.js";

test("Calcification: destroy the thrall, then the save — Slowed escalating to Petrified, the weakness note with the Slowed", async () => {
    const plan = compile(await spell("rank-9/calcification"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [, calcify] = plan.resolution.incarnate.phases;
    const slowed = calcify.plan.resolution.outcomes.failure.effects.find(e => e.slug === "slowed");
    assert.deepEqual([slowed.recurringSave.mode, slowed.recurringSave.atActions.slug, slowed.recurringSave.steps.failure], ["escalate", "petrified", 1]);
    const note = calcify.plan.resolution.outcomes.criticalFailure.noteEffects.at(-1);
    assert.deepEqual([note.withCondition.slug, note.rules[0].value], ["slowed", 10]);
});

test("Vitrifying Blast: a Reflex blast, its Fortitude escalation (max 3), weakness 3 × slowed", async () => {
    const plan = compile(await spell("rank-6/vitrifying-blast"));
    assert.equal(supported(plan), true);
    const slowed = plan.resolution.outcomes.failure.effects.find(e => e.slug === "slowed");
    assert.deepEqual([plan.resolution.check.statistic, slowed.recurringSave.statistic, slowed.recurringSave.maximum, slowed.recurringSave.steps], ["reflex", "fortitude", 3, { criticalSuccess: -2, success: -1, failure: 1, criticalFailure: 2 }]);
    const note = plan.resolution.outcomes.failure.noteEffects.at(-1);
    assert.deepEqual([note.withCondition.multiplier, note.rules[0].type], [3, ["sonic", "bludgeoning"]]);
    assert.equal(validNoteEffect({ ...note, withCondition: { slug: "slowed", multiplier: 3, extra: 1 } }), false);
});

test("Chrysopoetic Curse: two keyed questions on the failure row; Dread Secret: Frightened and the secret's note", async () => {
    const plan = compile(await spell("rank-7/chrysopoetic-curse"));
    assert.equal(supported(plan), true);
    const state = { outcomes: plan.resolution.outcomes };
    const target = { degree: "failure", gateAnswers: { armor: { answer: "yes" } } };
    assert.deepEqual(gmQuestionGates(state, target).map(gate => gate.key), ["armor", "held"]);
    assert.deepEqual(gmQuestionGates(state, target).map(gate => gateAnswerFor(target, gate)), ["yes", null]);
    const secret = compile(await spell("rank-6/dread-secret"));
    assert.equal(supported(secret), true);
    assert.deepEqual([secret.resolution.outcomes.criticalFailure.effects[0].value, secret.resolution.outcomes.success.noteEffects[0].label], [3, "Dread secret"]);
});
