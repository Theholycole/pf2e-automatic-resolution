import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
const durations = plan => Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree, outcome]) => [degree, (outcome.noteEffects ?? []).map(note => `${note.duration.value} ${note.duration.unit}`).join()]));

test('per-row durations: the effect before the table as a note lasting each row\'s duration (user direction)', async () => {
    const quiet = compileAbility(await spell('rank-1/forced-quiet'));
    assert.equal(inspectSavePlan(quiet).supported, true, JSON.stringify(inspectSavePlan(quiet).blockers));
    assert.deepEqual(durations(quiet), {criticalSuccess: '', success: '1 rounds', failure: '1 minutes', criticalFailure: '10 minutes'});
    const note = quiet.resolution.outcomes.failure.noteEffects[0];
    assert.ok(validNoteEffect(note));
    assert.match(note.text, /no creature more than 10 feet away can hear its whispers/);
    assert.doesNotMatch(note.text, /temporarily immune|depends on/);
    assert.ok(quiet.resolution.temporaryImmunity);
    // "As failure, but …": the failure's duration, and the restriction added to the note.
    const focus = compileAbility(await spell('rank-1/clouded-focus'));
    assert.equal(inspectSavePlan(focus).supported, true, JSON.stringify(inspectSavePlan(focus).blockers));
    assert.match(focus.resolution.outcomes.criticalFailure.noteEffects[0].text, /beyond a range of 10 feet\.$/);
    assert.equal(focus.resolution.reminders[0].kind, 'willing-choice');
    // "The effect lasts its normal duration.": the spell's 10 minutes.
    const shroud = compileAbility(await spell('rank-1/penumbral-shroud'));
    assert.equal(inspectSavePlan(shroud).supported, true, JSON.stringify(inspectSavePlan(shroud).blockers));
    assert.equal(durations(shroud).failure, '10 minutes');
});

test('per-row durations: kept strict', async () => {
    // Damage in the effect other than the no-move trigger (batch 75 reads Agitate's) keeps the spell blocked.
    const agitate = await spell('rank-1/agitate');
    assert.equal(inspectSavePlan(compileAbility(withText(agitate, text => text.replace('or take 2d8 mental damage at the end of its turn', 'and takes 2d8 mental damage at the end of its turn')))).supported, false);
    // An unconditional bonus in the effect isn't left to a note.
    const quiet = await spell('rank-1/forced-quiet');
    const bonus = compileAbility(withText(quiet, text => text.replace('as well as communication.', 'as well as communication. The target gains a +1 status bonus to Stealth checks.')));
    assert.equal(inspectSavePlan(bonus).supported, false);
    // A row that says anything else than its duration isn't read.
    const other = compileAbility(withText(quiet, text => text.replace('The duration is 1 minute.', 'The duration is 1 minute and the target is dazed.')));
    assert.equal(inspectSavePlan(other).supported, false);
});

test('situational numbers: capitalised "When"/"If", "to open the lock" and "reduce … to 0 Hit Points"', async () => {
    // (Bone Shield is automated since batch 162: a recreated spell shield.)
    assert.equal(compileAbility(await spell('rank-1/bone-shield')).resolution.kind, 'spell-shield');
    // (Protector Tree is automated since batch 165: the tree's Hit Points absorb Strikes.)
    assert.equal(compileAbility(await spell('rank-1/protector-tree')).resolution.kind, 'strike-absorber');
});
