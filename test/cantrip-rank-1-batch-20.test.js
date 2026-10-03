import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {noteAtRank} from '../scripts/basic-save-runtime.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Tame: an attitude step unless it saves, as a note for the spell\'s (heightened) duration', async () => {
    const tame = compileAbility(await spell('cantrip/tame'));
    assert.equal(inspectSavePlan(tame).supported, true, JSON.stringify(inspectSavePlan(tame).blockers));
    const note = tame.resolution.outcomes.failure.noteEffects[0];
    assert.equal(note.label, 'Attitude');
    assert.match(note.text, /improves by one step \(unfriendly to neutral/);
    assert.deepEqual([tame.resolution.outcomes.success.noteEffects ?? [], tame.resolution.outcomes.criticalFailure.noteEffects[0].label], [[], 'Attitude']);
    assert.deepEqual(tame.resolution.temporaryImmunity.duration, {value: 24, unit: 'hours'});
    assert.deepEqual(tame.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['trait', 'gm-confirmed']);
    // Heightened (3rd) 10 minutes, (6th) 1 hour.
    assert.deepEqual([1, 3, 6].map(rank => { const d = noteAtRank(note, tame.lifecycle, rank).duration; return `${d.value} ${d.unit}`; }), ['1 minutes', '10 minutes', '1 hours']);
});

test('Tame: kept strict', async () => {
    const tame = await spell('cantrip/tame');
    // Another save than the item's, or more rules after the attitude sentence, aren't read.
    assert.equal(inspectSavePlan(compileAbility(withText(tame, text => text.replace('unless it succeeds at a Will save', 'unless it succeeds at a Fortitude save')))).supported, false);
    assert.equal(inspectSavePlan(compileAbility(withText(tame, text => text.replace('the decision is up to the GM.', 'the decision is up to the GM. The target also takes 1d4 mental damage.')))).supported, false);
    const other = structuredClone(tame); other.system.target.value = '1 wild animal';
    assert.equal(inspectSavePlan(compileAbility(other)).supported, false);
});
