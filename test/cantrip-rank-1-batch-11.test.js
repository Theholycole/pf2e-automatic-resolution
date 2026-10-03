import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {extractConditionReferences} from '../src/compiler/description-parser.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {noteAtRank} from '../scripts/basic-save-runtime.js';
import {validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
const notes = (plan, degree) => (plan.resolution.outcomes[degree].noteEffects ?? []).map(note => note.label);

test('attitude changes are note Effects, never conditions (user direction)', async () => {
    assert.deepEqual(extractConditionReferences('@UUID[Compendium.pf2e.conditionitems.Item.v66R7FdOf11l94im]{Friendly} and @UUID[Compendium.pf2e.conditionitems.Item.x]{Frightened 1}').map(r => r.slug), ['frightened']);
    const charm = compileAbility(await spell('rank-1/charm'));
    assert.equal(inspectSavePlan(charm).supported, true, JSON.stringify(inspectSavePlan(charm).blockers));
    for (const degree of ['criticalSuccess', 'success', 'failure', 'criticalFailure']) assert.deepEqual(charm.resolution.outcomes[degree].effects ?? [], []);
    // One attitude note per row (two sentences merged), and the hostility note; each says the caster's hostility ends it.
    assert.deepEqual(notes(charm, 'failure'), ['Attitude', 'No hostile actions against the caster']);
    const attitude = charm.resolution.outcomes.failure.noteEffects[0];
    assert.match(attitude.text, /becomes Friendly toward you\. If it was Friendly, it becomes Helpful\. If you use hostile actions against the target, the spell ends\./);
    assert.deepEqual(notes(charm, 'criticalFailure'), ['Attitude']);
    assert.ok(charm.resolution.outcomes.failure.noteEffects.every(validNoteEffect));
    // "unaffected but thinks your spell was something harmless …": no note, no manual instruction.
    assert.deepEqual([notes(charm, 'success'), charm.resolution.outcomes.success.manualInstructions ?? []], [[], []]);
    // The GM's +4 circumstance bonus question on the save.
    assert.match(JSON.stringify(charm.resolution.attackAdjustment), /\+4 circumstance/);
    // Heightened (4th): notes lasting the spell's duration last until daily preparations (1 day); a note with its own timing doesn't change.
    assert.deepEqual([noteAtRank(attitude, charm.lifecycle, 1).duration.value, noteAtRank(attitude, charm.lifecycle, 1).duration.unit], [1, 'hours']);
    assert.deepEqual([noteAtRank(attitude, charm.lifecycle, 4).duration.value, noteAtRank(attitude, charm.lifecycle, 4).duration.unit], [1, 'days']);
    const own = {...attitude, duration: {...attitude.duration, value: 3, unit: 'rounds', sourceText: 'for 3 rounds'}};
    assert.equal(noteAtRank(own, charm.lifecycle, 4).duration.unit, 'rounds');
});

test('Charming Touch: GM-confirmed eligibility, row narration, and "As failure, but the target is helpful"', async () => {
    const touch = compileAbility(await spell('rank-1/charming-touch'));
    assert.equal(inspectSavePlan(touch).supported, true, JSON.stringify(inspectSavePlan(touch).blockers));
    assert.equal(touch.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    assert.deepEqual(notes(touch, 'failure'), ['Attitude', 'No hostile actions against the caster', 'Ends if the caster is hostile']);
    // The critical failure's own attitude note replaces the failure's.
    const crit = touch.resolution.outcomes.criticalFailure.noteEffects;
    assert.deepEqual(crit.map(note => note.label), ['Attitude', 'No hostile actions against the caster', 'Ends if the caster is hostile']);
    assert.equal(crit[0].text, 'The target is helpful.');
    assert.equal(touch.lifecycle.dismissal.action, 'Dismiss');
});

test('attitude notes: kept strict', async () => {
    const charm = await spell('rank-1/charm');
    // A save bonus the GM can't judge from the text (a roll result) isn't a question.
    const rolled = compileAbility(withText(charm, text => text.replace('if you or your allies recently threatened it or used hostile actions against it', 'if it critically failed a save today')));
    assert.equal(inspectSavePlan(rolled).supported, false);
    // Another eligibility phrase isn't read.
    const touch = await spell('rank-1/charming-touch');
    const other = structuredClone(touch); other.system.target.value = '1 creature that could love you';
    assert.equal(inspectSavePlan(compileAbility(other)).supported, false);
    // A mechanical rule beside the attitude still blocks the row.
    const mechanical = compileAbility(withText(charm, text => text.replace('It can\'t use hostile actions against you.', 'It takes 2d6 mental damage.')));
    assert.equal(inspectSavePlan(mechanical).supported, false);
});
