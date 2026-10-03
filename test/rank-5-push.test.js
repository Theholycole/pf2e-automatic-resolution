import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const moves = plan => Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree, outcome]) => [degree, outcome.forcedMovement
    ? `${outcome.forcedMovement.distance}${outcome.forcedMovement.heightening ? `+${outcome.forcedMovement.heightening.feet}/${outcome.forcedMovement.heightening.interval}` : ''}` : null]));

test('Repelling Pulse: "The creature takes double damage. The creature is pushed 20 feet away from you and is then knocked Prone.", heightened distance', async () => {
    const plan = compileAbility(await spell('rank-5/repelling-pulse'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(moves(plan), {criticalSuccess: null, success: null, failure: '10+5/2', criticalFailure: '20+5/2'});
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier ?? plan.resolution.outcomes.criticalFailure.damage.shared?.multiplier, 2);
});

test('Tornadic Gale: "takes double damage, is pushed 10 feet away from you, and is knocked Prone", and the pull into the line before the saves', async () => {
    const plan = compileAbility(await spell('rank-5/tornadic-gale'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(moves(plan), {criticalSuccess: null, success: null, failure: '5', criticalFailure: '10'});
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['area-pull']);
    // Any other pull before the table is an unread rule.
    const other = await spell('rank-5/tornadic-gale');
    other.system.description.value = other.system.description.value.replace('are pulled to the nearest unoccupied space within the line', 'are pulled 10 feet toward you');
    assert.ok(compileAbility(other).automation.pendingCapabilities.includes('preamble:forced-movement'));
});

// (Rank 3 batch 17: the half is the caster's healing on the failure rows, never the row's damage multiplier.)
test('Fearful Feast: "you regain Hit Points equal to half the damage" is the caster\'s healing, not the row\'s multiplier', async () => {
    const plan = compileAbility(await spell('rank-4/fearful-feast'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.casterBenefit.kind, plan.resolution.casterBenefit.fraction, plan.resolution.casterBenefit.degrees], ['heal', 0.5, ['failure', 'criticalFailure']]);
    assert.equal(plan.resolution.outcomes.failure.damage.multiplier ?? plan.resolution.outcomes.failure.damage.shared?.multiplier, 1);
});
