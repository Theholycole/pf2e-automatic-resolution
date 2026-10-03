import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const moves = plan => Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree, outcome]) => [degree, outcome.forcedMovement ? `${outcome.forcedMovement.kind} ${outcome.forcedMovement.distance} ${outcome.forcedMovement.direction}` : null]));

test('Pushing Gust: push-only rows, and "… and knocked Prone" on a critical failure', async () => {
    const plan = compileAbility(await spell('rank-1/pushing-gust'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(moves(plan), {criticalSuccess: null, success: 'push 5 away', failure: 'push 10 away', criticalFailure: 'push 10 away'});
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
});

test('Begone: push rows with the wall and ledge sentences as the push note', async () => {
    const plan = compileAbility(await spell('rank-3/begone'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(moves(plan), {criticalSuccess: null, success: 'push 5 away', failure: 'push 15 away', criticalFailure: 'push 30 away'});
    assert.equal(plan.resolution.forcedMovementNotes.length, 2);
    // Without its push rows, a wall sentence is an unread rule (preamble:collision), never dropped.
    const plain = await spell('rank-3/begone');
    plain.system.description.value = plain.system.description.value.replace(/pushed (\d+) feet away from you/g, 'moved $1 feet in a direction of your choice');
    assert.ok(compileAbility(plain).automation.pendingCapabilities.includes('preamble:collision'));
    // A push without a direction needs an area that starts at the caster (a cone or emanation) or a creature target.
    const gust = await spell('rank-1/pushing-gust');
    gust.system.description.value = gust.system.description.value.replace(/ away from you/g, '');
    gust.system.target.value = '';
    gust.system.area = {type: 'burst', value: 10};
    assert.equal(moves(compileAbility(gust)).failure, null);
});
