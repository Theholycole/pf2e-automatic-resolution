import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const spell = path => read(`spells/spells/${path}.json`);
const variantOf = (source, time) => {
    const item = structuredClone(source);
    const overlay = Object.values(source.system.overlays).find(entry => entry.system.time?.value === time).system;
    Object.assign(item.system, {target: overlay.target, time: overlay.time});
    delete item.system.overlays;
    return item;
};

test('targets by actions, within an emanation, without raising Wounded (Rebuke Death)', async () => {
    const source = await spell('rank-4/rebuke-death');
    // The base item ("1 to 3" actions) is cast through its variants.
    assert.equal(compileAbility(source).resolution.kind, 'unsupported');
    for (const time of ['1', '2', '3']) {
        const plan = compileAbility(variantOf(source, time));
        assert.equal(plan.automation.level, 'automatic', `${time}: ${JSON.stringify(plan.automation.pendingCapabilities)}`);
        assert.deepEqual(plan.resolution.healing, {formula: '3d6', damageType: 'untyped', recipient: 'target', within: 20, noWoundedIncrease: true});
        assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    }
    // A variant whose Target doesn't name as many creatures as its actions is refused.
    const wrong = variantOf(source, '2'); wrong.system.target.value = '3 living creatures';
    assert.equal(compileAbility(wrong).resolution.kind, 'unsupported');
    // Another area than an emanation isn't a range limit.
    const burst = variantOf(source, '1'); burst.system.area = {type: 'burst', value: 20};
    assert.equal(compileAbility(burst).resolution.kind, 'unsupported');
});

test('a reaction to a death, with the reaction\'s own limit as a note, and its trigger (Breath of Life)', async () => {
    const plan = compileAbility(await spell('rank-5/breath-of-life'));
    assert.equal(plan.automation.level, 'automatic', JSON.stringify(plan.automation.pendingCapabilities));
    assert.equal(plan.resolution.healing.formula, '5d8');
    assert.equal(plan.targeting.actorConstraints.complete, true);
    assert.deepEqual(plan.resolution.healing.notes.map(note => note.kind), ['trigger', 'reaction-limit']);
});

test('healing with a free movement for the target (Lively Flight)', async () => {
    const source = await spell('rank-3/lively-flight');
    const plan = compileAbility(source);
    assert.equal(plan.automation.level, 'automatic', JSON.stringify(plan.automation.pendingCapabilities));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    assert.deepEqual(plan.resolution.healing.notes.map(note => note.kind), ['free-movement']);
    // A movement that can put the target in danger (or anything else after the healing) stays a rule.
    const changed = structuredClone(source);
    changed.system.description.value = changed.system.description.value.replace('but can never put the target in danger', 'and can put the target in danger');
    assert.notEqual(compileAbility(changed).automation.level, 'automatic');
});

test('healing an undead minion, with its Effect (Necromancer\'s Generosity)', async () => {
    const effect = await read('spell-effects/spell-effect-necromancers-generosity.json');
    const profile = {id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}};
    const plan = compileAbility(await spell('rank-1/necromancers-generosity'), {nativeEffectCatalog: new Map([[profile.name, profile], [profile.id, profile]])});
    assert.equal(plan.automation.level, 'automatic', JSON.stringify(plan.automation.pendingCapabilities));
    assert.equal(plan.resolution.healing.damageType, 'void');
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'undead', present: true}]);
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'target');
});
