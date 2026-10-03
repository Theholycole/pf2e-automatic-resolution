import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {hazardFormula} from '../scripts/basic-save-runtime.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('ground hazards: the ground in the target\'s space burns for the spell\'s duration (user direction)', async () => {
    const ray = await spell('rank-1/fire-ray');
    const plan = compileAbility(ray);
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    // The attack: double on a critical hit, full on a hit.
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [2, 1, 0]);
    const hazard = plan.resolution.groundHazard;
    assert.deepEqual([hazard.where, hazard.degrees, hazard.events, hazard.damage], ['target-space', ['criticalSuccess', 'success', 'failure'], ['turn-end'],
        {formula: '(@item.rank)d6', type: 'fire'}]);
    assert.deepEqual([hazard.duration.mode, hazard.duration.anchor, hazard.duration.expiry], ['turn-boundary', 'target-turn', 'turn-end']);
    // Heightened (+1): the burning space's damage follows the cast rank.
    assert.deepEqual([hazardFormula(hazard.damage.formula, 1), hazardFormula(hazard.damage.formula, 4)], ['1d6', '4d6']);
});

test('ground hazards: other wordings of the degree and trigger', async () => {
    const ray = await spell('rank-1/fire-ray');
    const hit = compileAbility(withText(ray, text => text.replace('On any result other than a critical failure', 'On a hit')
        .replace('ends its turn in', 'enters or ends its turn in')));
    assert.deepEqual([hit.resolution.groundHazard.degrees, hit.resolution.groundHazard.events], [['criticalSuccess', 'success'], ['enter', 'turn-end']]);
});

test('ground hazards: kept strict', async () => {
    const ray = await spell('rank-1/fire-ray');
    // A trigger or formula the rule doesn't read.
    for (const replace of [text => text.replace('ends its turn in', 'stands in'), text => text.replace('(@item.rank)d6', '(@actor.level)d6')]) {
        const plan = compileAbility(withText(ray, replace));
        assert.equal(plan.resolution.groundHazard, undefined);
        assert.equal(inspectSavePlan(plan).supported, false);
    }
    // A duration the region can't keep.
    const lasting = structuredClone(ray); lasting.system.duration.value = 'until your next daily preparations';
    const plan = compileAbility(lasting);
    assert.ok(!plan.resolution.groundHazard);
    assert.equal(inspectSavePlan(plan).supported, false);
    // A hazard whose evidence doesn't match is refused at inspection.
    const tampered = compileAbility(ray);
    tampered.resolution.groundHazard.events = ['turn-end', 'somewhere'];
    assert.equal(inspectSavePlan(tampered).supported, false);
});
