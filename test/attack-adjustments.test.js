import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, correctSaveTarget} from '../scripts/basic-save-core.js';
import {reminderHTML} from '../scripts/strike-prelude-runtime.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('attack adjustments: metal targets (Magnetic Acceleration, Shocking Grasp)', async () => {
    const magnetic = compileAbility(await fixture('rank-3/magnetic-acceleration.json'));
    assert.equal(supported(magnetic), true, JSON.stringify(inspectSavePlan(magnetic).blockers));
    assert.deepEqual(magnetic.resolution.attackAdjustment.choices.map(choice => choice.value), [1, 0]);
    assert.equal(magnetic.resolution.attackAdjustment.modifierType, 'circumstance');
    const grasp = compileAbility(await fixture('rank-1/shocking-grasp.json'));
    assert.equal(supported(grasp), true, JSON.stringify(inspectSavePlan(grasp).blockers));
    assert.match(grasp.resolution.attackAdjustment.onApplies.formula, /\[persistent,electricity\]$/);
    assert.equal(grasp.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
});

test('attack adjustments: cover reduction (Phase Bolt) and ignored cover (Boomerang Shot)', async () => {
    const bolt = compileAbility(await fixture('cantrip/phase-bolt.json'));
    assert.equal(supported(bolt), true, JSON.stringify(inspectSavePlan(bolt).blockers));
    assert.deepEqual(bolt.resolution.attackAdjustment.choices.map(choice => choice.value), [0, 1, 2]);
    assert.equal(bolt.resolution.attackAdjustment.modifierType, 'untyped');
    const boomerang = compileAbility(await fixture('rank-5/boomerang-shot.json'));
    assert.equal(supported(boomerang), true, JSON.stringify(inspectSavePlan(boomerang).blockers));
    assert.deepEqual(boomerang.resolution.reminders, [{kind: 'attack-cover', text: "This attack ignores the target's Concealed condition and ignores all cover except greater cover. Heightened (9th): it ignores cover completely."}]);
    assert.match(reminderHTML(boomerang.resolution.reminders[0], String), /cover and concealment/);
});

test('attack adjustments: refused shapes and the GM answer', async () => {
    const source = await fixture('rank-1/shocking-grasp.json');
    source.system.description.value = source.system.description.value.replace(' On a critical hit, double the initial damage, but not the persistent damage.', '');
    assert.equal(supported(compileAbility(source)), false); // the gated persistent must say it isn't doubled
    const plan = compileAbility(await fixture('rank-3/magnetic-acceleration.json'));
    plan.resolution.attackAdjustment.choices[0].value = 9;
    assert.equal(supported(plan), false);
    const state = {status: 'collecting', attackAdjustment: {choices: [{label: 'Yes', value: 1}, {label: 'No', value: 0}]},
        targets: [{id: 't', applicationStatus: 'pending', attackAdjustment: {status: 'pending'}, revision: 0}]};
    correctSaveTarget(state, 't', {action: 'attack-adjustment', degree: '1'}, 'gm');
    assert.deepEqual(state.targets[0].attackAdjustment, {status: 'answered', value: 1, label: 'Yes', userId: 'gm'});
    state.targets[0].degree = 'success';
    assert.throws(() => correctSaveTarget(state, 't', {action: 'attack-adjustment', degree: '0'}, 'gm'), /already rolled/);
    assert.throws(() => correctSaveTarget({...state, targets: [{id: 't', applicationStatus: 'pending', attackAdjustment: {status: 'pending'}}]}, 't', {action: 'attack-adjustment', degree: '5'}, 'gm'));
});
