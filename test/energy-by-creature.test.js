import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, validateActorTarget, damageSwapApplies, swapDamageType} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const variant = (source, name) => {
    const item = structuredClone(source);
    const overlay = Object.values(source.system.overlays).find(entry => entry.name === name).system;
    if (overlay.damage) item.system.damage['0'] = {...item.system.damage['0'], ...overlay.damage['0']};
    if (overlay.traits) item.system.traits = {...item.system.traits, ...overlay.traits};
    delete item.system.overlays;
    return item;
};
const creature = traits => ({type: 'npc', isOfType: () => true, traits: new Set(traits), system: {traits: {value: traits}, attributes: {hp: {}}}});

test('Execute: each variant harms the creatures its energy harms', async () => {
    const source = await spell('rank-7/execute');
    const voidPlan = compileAbility(variant(source, 'Execute (Void)'));
    const vitalityPlan = compileAbility(variant(source, 'Execute (Vitality)'));
    for (const plan of [voidPlan, vitalityPlan]) assert.equal(inspectSavePlan(plan).route, 'basic-save', JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(voidPlan.targeting.actorConstraints.predicates, [{kind: 'not-undead-or-void-healing'}]);
    assert.deepEqual(vitalityPlan.targeting.actorConstraints.predicates, [{kind: 'undead-or-void-healing'}]);
    assert.equal(validateActorTarget(voidPlan.targeting.actorConstraints, creature(['humanoid'])).eligible, true);
    assert.equal(validateActorTarget(voidPlan.targeting.actorConstraints, creature(['undead'])).eligible, false);
    assert.equal(validateActorTarget(vitalityPlan.targeting.actorConstraints, creature(['undead'])).eligible, true);
    // The damage in the text must be the variant's entry.
    const wrong = variant(source, 'Execute (Void)'); wrong.system.damage['0'].formula = '60';
    assert.notEqual(inspectSavePlan(compileAbility(wrong)).route, 'basic-save');
});

test('Divine Armageddon: one roll, void as vitality for undead and void-healing creatures', async () => {
    const plan = compileAbility(await spell('rank-8/divine-armageddon'));
    assert.equal(inspectSavePlan(plan).route, 'basic-save', JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.damageSwap.from, plan.resolution.damageSwap.to], ['void', 'vitality']);
    assert.equal(plan.compilerEvidence.energyByCreature.convenienceRolls, 2);
    assert.equal(damageSwapApplies(plan.resolution.damageSwap, creature(['undead'])), true);
    assert.equal(damageSwapApplies(plan.resolution.damageSwap, creature(['humanoid'])), false);
    const json = {formula: '{(10d6)[void],(10d6)[spirit]}', terms: [{options: {flavor: 'void'}}, {options: {flavor: 'spirit'}}]};
    assert.deepEqual(swapDamageType(json, 'void', 'vitality'), {formula: '{(10d6)[vitality],(10d6)[spirit]}', terms: [{options: {flavor: 'vitality'}}, {options: {flavor: 'spirit'}}]});
    // A tampered swap is refused.
    const tampered = structuredClone(plan); tampered.resolution.damageSwap.to = 'fire';
    assert.equal(inspectSavePlan(tampered).supported, false);
});
