import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Waking Nightmare: Paralyzed only for a sleeping creature (which wakes), and a note while frightened', async () => {
    const plan = compileAbility(await spell('rank-1/waking-nightmare'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    for (const outcome of [failure, criticalFailure]) {
        const paralyzed = outcome.effects.find(effect => effect.slug === 'paralyzed');
        assert.equal(paralyzed.gate.kind, 'asleep');
        assert.equal(paralyzed.gate.wakes, true);
        assert.equal(outcome.effects.find(effect => effect.slug === 'frightened').gate, undefined);
    }
    assert.equal(success.effects.some(effect => effect.slug === 'paralyzed'), false);
    // The note lasts as many of the creature's turns as its Frightened value.
    const notes = [success, failure, criticalFailure].map(outcome => outcome.noteEffects.find(note => note.label === 'Hit while frightened'));
    assert.deepEqual(notes.map(note => [note.duration.value, note.duration.anchor, note.duration.expiry]), [[1, 'target-turn', 'turn-end'], [2, 'target-turn', 'turn-end'], [3, 'target-turn', 'turn-end']]);
    assert.match(notes[0].text, /1 additional mental damage each time it's hit by a Strike.*\+1 per rank above 1/);
    assert.ok(notes.every(validNoteEffect));
});

test('asleep gate and frightened note: kept strict', async () => {
    const source = await spell('rank-1/waking-nightmare');
    // Another condition on the gate ("If it's prone") isn't read.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace("If it's asleep, it wakes up and", "If it's prone, it stands and")))).supported, false);
    // A tampered gate is refused.
    const tampered = compileAbility(source);
    tampered.resolution.outcomes.failure.effects.find(effect => effect.slug === 'paralyzed').gate.kind = 'awake';
    assert.equal(inspectSavePlan(tampered).supported, false);
    // A damage rule of another kind ("each time it attacks") stays unaccounted.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace("each time it's hit by a Strike", 'each time it attacks')))).supported, false);
});

test('Wilding Word: the harm penalty and the Sickened each time it damages the caster are notes; the cast applies no Sickened', async () => {
    const plan = compileAbility(await spell('cantrip/wilding-word'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success, failure, criticalFailure].map(outcome => outcome.effects.length), [0, 0, 0]);
    assert.deepEqual(success.noteEffects.map(note => note.label), ['Penalty against the caster']);
    assert.deepEqual(failure.noteEffects.map(note => note.label), ['Penalty against the caster', 'Sickened when it damages you']);
    assert.match(failure.noteEffects[1].text, /Sickened 1\.$/);
    assert.match(criticalFailure.noteEffects[1].text, /Sickened 2\.$/);
    // The spell's sustained minute; the notes join the sustained cast.
    assert.deepEqual([failure.noteEffects[1].duration.value, failure.noteEffects[1].duration.unit, failure.noteEffects[1].duration.sustained], [1, 'minutes', true]);
    assert.ok([success, failure, criticalFailure].flatMap(outcome => outcome.noteEffects).every(note => validNoteEffect(note) && !note.rules));
    // The animal/fungus/plant save penalty is the GM's question.
    assert.match(plan.resolution.attackAdjustment.question, /animal, fungus, or plant/);
    assert.equal(plan.resolution.attackAdjustment.appliesTo, "save");
});

test('Wilding Word rules: kept strict', async () => {
    const source = await spell('cantrip/wilding-word');
    // A critical failure raising another condition isn't read.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('the sickened value is 2', 'the frightened value is 2')))).supported, false);
    // A penalty against rolls that don't harm the caster isn't this rule.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('that would harm you', 'against your allies')))).supported, false);
});
