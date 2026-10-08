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


// Rank 9, batch 9 (2026-10-05): the end of feature group 4 — Fateful Condemnation (an aura following the target), Overwhelming Presence (a tribute
// counter), Tanglecurse (the spores' roll, the bloom following the target), Undertaker (the ground question), Seize Identity (the controls card).
import { validNoteEffect } from "../scripts/note-effects.js";

test("Fateful Condemnation: row damage and Slowed; the aura's penalty for the target and its allies, Slowed for its allies on a critical failure", async () => {
    const plan = compile(await spell("rank-6/fateful-condemnation"));
    assert.equal(supported(plan), true);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.formulas[0].formula), ["4d6[mental]", "8d6[mental]", "16d6[mental]"]);
    const aura = plan.resolution.targetAura;
    assert.deepEqual([aura.radius, aura.seconds, aura.byDegree.success.rules[0].value, aura.byDegree.criticalFailure.allyTurnCondition.slug], [10, 60, -1, "slowed"]);
    const forged = structuredClone(plan); forged.resolution.targetAura.byDegree.success.rules[0].value = -6;
    assert.equal(supported(forged), false);
});

test("Overwhelming Presence and Undertaker: the tribute counter granting Fascinated; the ground question, row damage and notes", async () => {
    const plan = compile(await spell("rank-9/overwhelming-presence"));
    assert.equal(supported(plan), true);
    const owed = plan.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual([owed.counter, owed.rules[0].flag, plan.resolution.temporaryImmunity.duration.value], [6, "conditionFascinated", 1]);
    assert.equal(validNoteEffect({ ...owed, counter: 0 }), false);
    const grave = compile(await spell("rank-9/undertaker"));
    assert.equal(supported(grave), true);
    assert.deepEqual([grave.resolution.outcomes.failure.effects[0].gate.key, grave.resolution.outcomes.criticalFailure.noteEffects[0].label], ["ground", "Stone sarcophagus"]);
});

test("Tanglecurse and Seize Identity: the spores' roll and the bloom's terrain; the controls card's two PF2e Effects and the Sustain's save", async () => {
    const tangle = compile(await spell("rank-6/tanglecurse"));
    assert.equal(supported(tangle), true);
    assert.deepEqual(tangle.resolution.conditionRoll.options, ["enfeebled", "clumsy", "drained", "stupefied"]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => tangle.resolution.targetAura.byDegree[d].radius), [5, 10, 15]);
    const seize = compile(await spell("rank-6/seize-identity"));
    assert.equal(supported(seize), true);
    const parts = seize.resolution.controls.parts;
    assert.deepEqual(parts.map(part => part.kind), ["native-effect", "native-effect", "save"]);
    assert.equal(parts[2].plan.resolution.outcomes.failure.effects[0].increment, true);
});
