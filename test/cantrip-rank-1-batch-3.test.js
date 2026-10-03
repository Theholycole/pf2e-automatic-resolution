import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) { if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object') mergeDeep(target[key], value); else target[key] = value; } return target; }
const variant = (source, time) => { const [, overlay] = Object.entries(source.system.overlays).find(([, o]) => o.system?.time?.value === time);
    const copy = structuredClone(source); copy.system = mergeDeep(copy.system, structuredClone(overlay.system)); delete copy.system.overlays; return copy; };
const pulls = plan => ['failure', 'criticalFailure'].map(degree => `${plan.resolution.outcomes[degree].forcedMovement?.kind} ${plan.resolution.outcomes[degree].forcedMovement?.distance} ${plan.resolution.outcomes[degree].forcedMovement?.direction}`);

test('Gravitational Pull: "is pulled 10 feet closer to you unless it succeeds", Prone on a critical failure, 20 feet for 2 actions', async () => {
    const source = await spell('rank-1/gravitational-pull');
    const one = compileAbility(variant(source, '1')), two = compileAbility(variant(source, '2')), three = compileAbility(variant(source, '3'));
    for (const plan of [one, two, three]) assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(pulls(one), ['pull 10 toward', 'pull 10 toward']);
    assert.deepEqual(pulls(two), ['pull 20 toward', 'pull 20 toward']);
    assert.deepEqual(one.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    // A variant distance change that doesn't name the base distance is refused.
    const odd = structuredClone(source);
    odd.system.description.value = odd.system.description.value.replace('20 feet instead of 10', '20 feet instead of 15');
    assert.equal(inspectSavePlan(compileAbility(variant(odd, '2'))).supported, false);
});

test('Call of the Grave and Hydraulic Push: written attack tables for "1 living creature" and "1 creature or unattended object"', async () => {
    const grave = compileAbility(await spell('rank-1/call-of-the-grave'));
    assert.equal(inspectSavePlan(grave).supported, true, JSON.stringify(inspectSavePlan(grave).blockers));
    assert.deepEqual(grave.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    assert.equal(grave.resolution.outcomes.criticalSuccess.effects.find(effect => effect.slug === 'slowed').whileCondition, 'sickened');
    const push = compileAbility(await spell('rank-1/hydraulic-push'));
    assert.equal(inspectSavePlan(push).supported, true, JSON.stringify(inspectSavePlan(push).blockers));
    assert.deepEqual(['criticalSuccess', 'success'].map(degree => push.resolution.outcomes[degree].forcedMovement.distance), [10, 5]);
});
