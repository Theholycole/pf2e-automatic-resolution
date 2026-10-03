import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {inspectCompiledNativeOutcomeEffect} from '../scripts/native-outcome-effects.js';
import {effectModifiers, recipientMatchesProof, inspectTextModifierProof} from '../scripts/effect-modifier-proof.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const profile = effect => ({id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {
    ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: false, removesAfterRoll: false},
    mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}});
const catalogOf = effect => new Map([[effect.name, profile(effect)], [effect._id, profile(effect)]]);
const variant = (source, id) => {
    const item = structuredClone(source);
    for (const [key, value] of Object.entries(source.system.overlays[id].system)) item.system[key] = structuredClone(value);
    delete item.system.overlays;
    return item;
};
const byName = (source, pattern) => Object.keys(source.system.overlays).find(id => pattern.test(source.system.overlays[id].name));
const load = async (spell, effect) => ({source: await read(`spells/spells/rank-1/${spell}.json`), effect: await read(`spell-effects/${effect}.json`)});

test('effect modifiers: read per recipient from the Effect rules', async () => {
    const lay = await read('spell-effects/spell-effect-lay-on-hands.json'), touch = await read('spell-effects/spell-effect-touch-of-the-void.json');
    const of = (effect, context) => effectModifiers({name: effect.name, rules: effect.system.rules}, context);
    assert.deepEqual(of(lay, {self: false, undead: false}), [{selector: 'ac', type: 'status', value: 2}]);
    assert.deepEqual(of(lay, {self: false, undead: true}), [{selector: 'ac', type: 'status', value: -2}]);
    assert.deepEqual(of(touch, {self: true, undead: true}), [{selector: 'damage', type: 'status', value: 2}]);
    assert.deepEqual(of(touch, {self: false, undead: false}), [{selector: 'ac', type: 'status', value: -2}]);
    // An unknown predicate or rule makes the Effect unprovable.
    assert.equal(effectModifiers({name: 'X', rules: [{key: 'FlatModifier', selector: 'ac', type: 'status', value: 2, predicate: ['target:trait:fiend']}]}, {self: false, undead: false}), null);
    assert.equal(effectModifiers({name: 'X', rules: [{key: 'RollOption', option: 'x'}]}, {self: false, undead: false}), null);
    // Recipients: the caster or not, undead or not.
    const actor = (uuid, traits) => ({uuid, traits: new Set(traits)});
    const proof = {context: {self: false, undead: false}};
    assert.equal(recipientMatchesProof(proof, actor('A', []), 'C'), true);
    assert.equal(recipientMatchesProof(proof, actor('C', []), 'C'), false);
    assert.equal(recipientMatchesProof(proof, actor('A', ['undead']), 'C'), false);
});

test('self / not-self: Lay on Hands and Touch of the Void variants', async () => {
    for (const [spell, effectFile, healCondition, healModifier, damageModifier] of [
        ['lay-on-hands', 'spell-effect-lay-on-hands', 'not-self', {selector: 'ac', type: 'status', value: 2}, {selector: 'ac', type: 'status', value: -2}],
        ['touch-of-the-void', 'spell-effect-touch-of-the-void', 'self', {selector: 'damage', type: 'status', value: 2}, {selector: 'ac', type: 'status', value: -2}]]) {
        const {source, effect} = await load(spell, effectFile);
        const catalog = catalogOf(effect);
        assert.notEqual(compileAbility(source, {nativeEffectCatalog: catalog}).automation.level, 'automatic', spell);
        const healing = compileAbility(variant(source, byName(source, /Healing/)), {nativeEffectCatalog: catalog});
        assert.equal(healing.resolution.kind, 'effect', spell);
        assert.equal(healing.automation.level, 'automatic', `${spell}: ${healing.automation.pendingCapabilities}`);
        assert.equal(healing.resolution.healing.formula, '6', spell);
        assert.equal(healing.resolution.applications[0].recipientCondition, healCondition, spell);
        assert.deepEqual(healing.nativeEffects.onUse[0].modifierProof.modifiers, [healModifier], spell);
        const damage = compileAbility(variant(source, byName(source, /Vs\./)), {nativeEffectCatalog: catalog});
        assert.equal(inspectSavePlan(damage).supported, true, `${spell}: ${JSON.stringify(inspectSavePlan(damage).blockers)}`);
        for (const degree of ['failure', 'criticalFailure']) {
            const [outcomeEffect] = damage.resolution.outcomes[degree].nativeEffects;
            assert.deepEqual(outcomeEffect.outcomeRule.modifiers, [damageModifier], spell);
            assert.equal(inspectCompiledNativeOutcomeEffect(outcomeEffect, {degree}).supported, true, spell);
        }
        assert.equal(damage.resolution.outcomes.success.nativeEffects?.length ?? 0, 0, spell);
    }
});

test('self / not-self: a text that disagrees with the Effect is refused', async () => {
    const {source, effect} = await load('lay-on-hands', 'spell-effect-lay-on-hands');
    const catalog = catalogOf(effect);
    // The text says +3; the Effect gives +2.
    const wrong = variant(source, byName(source, /Healing/));
    wrong.system.description.value = wrong.system.description.value.replace('+2 status bonus', '+3 status bonus');
    assert.notEqual(compileAbility(wrong, {nativeEffectCatalog: catalog}).resolution.kind, 'effect');
    // An Effect whose penalty lasts longer than the text's 1 round.
    const longer = structuredClone(effect); longer.system.duration.value = 2;
    assert.notEqual(compileAbility(variant(source, byName(source, /Healing/)), {nativeEffectCatalog: catalogOf(longer)}).automation.level, 'automatic');
    // A changed live Effect fails the runtime proof.
    const damage = compileAbility(variant(source, byName(source, /Vs\./)), {nativeEffectCatalog: catalog});
    const proof = damage.resolution.outcomes.failure.nativeEffects[0].outcomeRule;
    const changed = structuredClone(effect); changed.system.rules[1].value = -1;
    assert.equal(inspectTextModifierProof(proof, {name: changed.name, system: changed.system}).supported, false);
    // An extra rule in the healing entry.
    const extra = variant(source, byName(source, /Healing/));
    extra.system.description.value = extra.system.description.value.replace('for 1 round.</li>', 'for 1 round. It also becomes quickened.</li>');
    assert.notEqual(compileAbility(extra, {nativeEffectCatalog: catalog}).resolution.kind, 'effect');
});
