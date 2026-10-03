import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('"vitality effects heal it only half as much as normal for 1 round": a note beside the row\'s damage', async () => {
    const touch = compileAbility(await spell('rank-1/touch-of-undeath'));
    assert.equal(inspectSavePlan(touch).supported, true, JSON.stringify(inspectSavePlan(touch).blockers));
    const failure = touch.resolution.outcomes.failure;
    assert.equal(failure.damage.multiplier, 1);
    assert.deepEqual(failure.noteEffects.map(note => [note.label, note.text, note.duration.value, note.duration.unit]),
        [['Healing halved', 'Vitality effects heal it only half as much as normal for 1 round.', 1, 'rounds']]);
    assert.equal(touch.resolution.outcomes.criticalFailure.noteEffects[0].duration.unit, 'minutes');
});

test('healing halved: kept strict', async () => {
    const touch = await spell('rank-1/touch-of-undeath');
    // A healing change the note doesn't recognise stays unaccounted.
    assert.equal(inspectSavePlan(compileAbility(withText(touch, text => text.replace('heal it only half as much as normal for 1 round', 'heal it for double for 1 round')))).supported, false);
});
