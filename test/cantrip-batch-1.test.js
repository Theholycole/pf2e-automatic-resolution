import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));

test('Gale Blast and Pummeling Rubble: "takes full damage and is pushed 5 feet away from you" is a GM push note', async () => {
    for (const path of ['cantrip/gale-blast', 'rank-1/pummeling-rubble']) {
        const plan = compileAbility(await spell(path));
        assert.equal(inspectSavePlan(plan).supported, true, `${path}: ${JSON.stringify(inspectSavePlan(plan).blockers)}`);
        assert.deepEqual(['failure', 'criticalFailure'].map(degree => [plan.resolution.outcomes[degree].forcedMovement.distance, plan.resolution.outcomes[degree].forcedMovement.direction]),
            [[5, 'away'], [10, 'away']]);
        assert.equal(plan.resolution.outcomes.success.forcedMovement, undefined);
    }
    // A push whose distance the heightened text changes is read only in the stated form (Repelling Pulse, rank 3 batch 1 /
    // rank 5): any other heightened wording about the distance isn't fixed.
    const repelling = await spell('rank-5/repelling-pulse');
    repelling.system.description.value = repelling.system.description.value.replace('the distance the target is moved on a failure and critical failure increases by 5 feet', 'the push distance grows by 5 feet');
    assert.equal(compileAbility(repelling).resolution.outcomes.failure.forcedMovement ?? null, null);
    // A push without a damage row, or another direction, isn't read.
    const toward = await spell('cantrip/gale-blast');
    toward.system.description.value = toward.system.description.value.replace('pushed 5 feet away from you', 'pushed 5 feet toward you');
    assert.equal(inspectSavePlan(compileAbility(toward)).supported, false);
});

test('Scatter Scree: damage on casting, difficult terrain for the duration, recast ends the previous one', async () => {
    const plan = compileAbility(await spell('cantrip/scatter-scree'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.area, lingering.terrain, lingering.recastEnds, lingering.durationSeconds],
        [[], true, {type: 'line', value: 10}, {difficulty: 2, movement: ['walk'], hazardous: false}, true, 60]);
    assert.deepEqual(lingering.notes, ['A creature can Interact to clear a square of this scree.']);
    // A recast sentence naming another spell is refused.
    const other = await spell('cantrip/scatter-scree');
    other.system.description.value = other.system.description.value.replace('any previous <em>scatter scree</em>', 'any previous <em>rock storm</em>');
    assert.equal(isExecutableLingeringPlan(compileAbility(other)), false);
    // Without the terrain sentence it's an ordinary area save.
    const plain = await spell('cantrip/scatter-scree');
    plain.system.description.value = plain.system.description.value.replace(/The ground in the area becomes difficult terrain[^.]*\./, '').replace(/A creature can Interact[^.]*\./, '');
    assert.equal(compileAbility(plain).resolution.lingering, undefined);
});

test('Bramble Bush: hazardous difficult terrain until your next turn, entering deals its own formula', async () => {
    const plan = compileAbility(await spell('cantrip/bramble-bush'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.endsAt, lingering.terrain.hazardous, lingering.enterDamage.formula],
        [['enter'], true, 'caster-turn-start', true, '(1d4 + ceil(@item.level / 2) - 1)[piercing]']);
    const enter = lingeringExposurePlan(plan, {event: 'enter'});
    assert.equal(enter.resolution.sharedDamage.formula, '(1d4 + ceil(@item.level / 2) - 1)[piercing]');
    assert.equal(inspectSavePlan(enter).supported, true);
    assert.equal(lingeringExposurePlan(plan).resolution.sharedDamage.mode, 'pf2e-item-damage');
    // Hazardous terrain without the entering damage is refused.
    const bare = await spell('cantrip/bramble-bush');
    bare.system.description.value = bare.system.description.value.replace(/Any creature entering the square[^.]*\./, '');
    assert.equal(isExecutableLingeringPlan(compileAbility(bare)), false);
});
