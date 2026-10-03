import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));

test('Tidal Surge: the caster moves an unwilling target that fails; a willing target doesn\'t save (a reminder)', async () => {
    const plan = compileAbility(await spell('rank-1/tidal-surge'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const move = plan.resolution.outcomes.failure.forcedMovement;
    assert.deepEqual([move.kind, move.distance, move.upTo, move.optional, move.direction, move.note], ['push', 10, true, true, 'any', '20 feet through a body of water']);
    assert.equal(plan.resolution.outcomes.success.forcedMovement ?? null, null);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['willing-no-save']);
    // Another save than the item's isn't read.
    const other = await spell('rank-1/tidal-surge');
    other.system.description.value = other.system.description.value.replace('attempt a Fortitude save', 'attempt a Reflex save');
    assert.equal(inspectSavePlan(compileAbility(other)).supported, false);
});
