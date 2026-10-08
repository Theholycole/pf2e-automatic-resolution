import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 35 (2026-10-01): The Parrot's Whisper, Mental Map, Metal Reverberation, Bralani Referendum.

test("The Parrot's Whisper: the highest weakness revealed now or at the start of the caster's next turn", async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const {highestWeaknesses} = await import('../scripts/reveal-runtime.js');
    const plan = compile(await spell('rank-2/the-parrots-whisper'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const reveal = degree => plan.resolution.outcomes[degree].noteEffects[0].reveal ?? null;
    assert.deepEqual([reveal('criticalSuccess'), reveal('success')?.timing, reveal('failure')?.timing, reveal('criticalFailure')?.timing], [null, 'expiry', 'now', 'now']);
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.anchor, 'source-turn');
    // An expiry reveal needs a fixed note.
    assert.equal(validNoteEffect({...plan.resolution.outcomes.success.noteEffects[0], duration: {mode: 'unlimited'}}), false);
    assert.deepEqual(highestWeaknesses({system: {attributes: {weaknesses: [{type: 'fire', value: 5}, {type: 'cold', value: 5}, {type: 'acid', value: 2}]}}}), ['fire 5', 'cold 5']);
    assert.equal(highestWeaknesses({system: {attributes: {weaknesses: []}}}), null);
});

test('Mental Map: the caster gets PF2e\'s Effect on a failed save; the critical failure\'s erasing is a note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/mental-map'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const effect = plan.resolution.casterRowEffect;
    assert.deepEqual([effect.degrees, effect.skill, effect.value, effect.type], [['failure', 'criticalFailure'], 'survival', 2, 'circumstance']);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.noteEffects.map(note => note.duration.value), [24]);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'willing-choice'));
    // An Effect with another bonus is refused.
    const forged = structuredClone(plan); forged.resolution.casterRowEffect.document.mechanics.rules[1].value = 4;
    assert.equal(inspectSavePlan(forged).supported, false);
});

test('Metal Reverberation: a placed 5-foot area on the object, saving when cast and on each Sustain', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/metal-reverberation'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.area], [['sustain'], true, 'placed', {type: 'emanation', value: 5}]);
    assert.match(lingering.notes.join(' '), /target object/);
});

test('Bralani Referendum: the GM-triggered save, once a round, with the chosen conditions', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/bralani-referendum'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const {gmTrigger, events, oncePerRound, dismissible} = plan.resolution.lingering;
    assert.deepEqual([events, oncePerRound, dismissible], [['gm-trigger'], true, true]);
    assert.deepEqual([gmTrigger.choices, gmTrigger.count, gmTrigger.step], [['clumsy', 'drained', 'enfeebled', 'stupefied'], 1, {interval: 2, add: 1}]);
    const forged = structuredClone(plan); forged.resolution.lingering.oncePerRound = false;
    assert.equal(isExecutableLingeringPlan(forged), false);
});
