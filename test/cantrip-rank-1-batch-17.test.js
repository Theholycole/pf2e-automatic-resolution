import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('a row\'s rolled duration ("affected for 1d4 rounds") is rolled for each creature; the damage the target deals is the GM\'s', async () => {
    const mercy = compileAbility(await spell('rank-1/forced-mercy'));
    assert.equal(inspectSavePlan(mercy).supported, true, JSON.stringify(inspectSavePlan(mercy).blockers));
    const failure = mercy.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual([failure.duration.value, failure.duration.valueRoll, failure.duration.unit], [null, '1d4', 'rounds']);
    assert.ok(validNoteEffect(failure));
    assert.match(failure.text, /becomes nonlethal/);
    // The Effect is made only once the rounds are rolled.
    const runtime = {castId: 'c', castRank: 1, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'Forced Mercy', targetActorUuid: 'T'};
    assert.throws(() => prepareNoteEffectSource(failure, runtime));
    assert.equal(prepareNoteEffectSource({...failure, duration: {...failure.duration, value: 3, valueRoll: undefined}}, runtime).system.duration.value, 3);
    assert.deepEqual([mercy.resolution.outcomes.success.noteEffects[0].duration.value, mercy.resolution.outcomes.criticalFailure.noteEffects[0].duration.unit], [1, 'minutes']);
});

test('rolled durations: kept strict', async () => {
    const mercy = await spell('rank-1/forced-mercy');
    // Damage the spell itself deals is never left to a note.
    assert.equal(inspectSavePlan(compileAbility(withText(mercy, text => text.replace('becomes nonlethal', 'becomes nonlethal, and the target takes 1d6 mental damage')))).supported, false);
    // A rolled value other than rounds isn't read.
    assert.equal(validNoteEffect({label: 'x', text: 'x', sourceText: 'x', duration: {mode: 'fixed', value: null, valueRoll: '1d4', unit: 'minutes'}}), false);
});
