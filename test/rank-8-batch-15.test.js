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


// Rank 8, batch 15 (2026-10-05): feature group 4, part 1 — lasting states as row notes: Undermine Reality, Fabricated Truth, Cursed Metamorphosis,
// Remake Physiology.
import { validNoteEffect } from "../scripts/note-effects.js";

const notes = (plan, degree) => plan.resolution.outcomes[degree].noteEffects ?? [];

test("Undermine Reality: Quasi-real by row (next turn / 1 minute with the Will save / unlimited), its rules and flags", async () => {
    const plan = compile(await spell("rank-8/undermine-reality"));
    assert.equal(supported(plan), true);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [notes(plan, d)[0].label, notes(plan, d)[0].duration.mode, notes(plan, d)[0].duration.value ?? null]),
        [["Quasi-real", "fixed", 1], ["Quasi-real", "fixed", 10], ["Quasi-real", "unlimited", null]]);
    const failure = notes(plan, "failure")[0];
    assert.deepEqual([failure.recurringSave.statistic, failure.halfStrikes, failure.sourceSavesBetter, failure.rules[0].key], ["will", true, true, "AdjustDegreeOfSuccess"]);
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
});

test("Fabricated Truth: belief for 1 week or unlimited, the critical success's whisper", async () => {
    const plan = compile(await spell("rank-10/fabricated-truth"));
    assert.equal(supported(plan), true);
    assert.deepEqual([notes(plan, "failure")[0].duration.value, notes(plan, "failure")[0].duration.unit, notes(plan, "criticalFailure")[0].duration.mode], [7, "days", "unlimited"]);
    assert.equal(notes(plan, "criticalSuccess")[0].reveal.kind, "gm-command");
});

test("Cursed Metamorphosis and Remake Physiology: Sickened 1, the transformation's own save; the remade body's rules and flat check", async () => {
    const morph = compile(await spell("rank-6/cursed-metamorphosis"));
    assert.equal(supported(morph), true);
    assert.equal(morph.resolution.outcomes.success.effects[0].slug, "sickened");
    assert.deepEqual([notes(morph, "failure")[0].endSave.statistic, notes(morph, "criticalFailure")[0].duration.mode], ["will", "unlimited"]);
    const remake = compile(await spell("rank-9/remake-physiology"));
    assert.equal(supported(remake), true);
    const body = notes(remake, "failure")[0];
    assert.deepEqual([body.rules.length, body.rules[0].value, body.turnStartFlat.flat, body.turnStartFlat.condition.slug], [6, -20, 5, "slowed"]);
    assert.equal(validNoteEffect({ ...body, turnStartFlat: { ...body.turnStartFlat, flat: 30 } }), false);
});
