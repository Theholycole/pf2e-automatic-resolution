import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, isConditionIncreases, isTriggeredDamage} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 6 (2026-10-06): the Witches+ hexes saving again on each Sustain — Holding Glyph, Realityflicker, Lost in the Crowd, Judge Soul.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
// (The modules' Effects, as the census tool's catalog has them.)
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Holding Glyph: the toggle-gated penalty and the move-trait damage until the next save', () => {
    const plan = compile('Holding Glyph');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.repeatable.save, true);
    const note = plan.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.deepEqual(note.rules.map(rule => rule.key), ['RollOption', 'FlatModifier']);
    assert.equal(note.triggeredDamage.formula, '2*(@item.rank - 0)');
    assert.ok(isTriggeredDamage(note.triggeredDamage));
    assert.ok(validNoteEffect(note));
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].triggeredDamage, undefined);
});

test('Realityflicker: the rolled condition (a 4 the caster\'s choice) and the critical failure\'s second roll', () => {
    const plan = compile('Realityflicker');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.conditionRoll, {formula: '1d4', results: {1: 'clumsy', 2: 'enfeebled', 3: 'stupefied'}, chooseOn: [4], options: ['clumsy', 'enfeebled', 'stupefied'], criticalSecond: true});
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [1, 2]);
    assert.ok(plan.resolution.outcomes.failure.effects.every(effect => effect.choiceGroup === 'condition-roll' && effect.duration.expiry === 'turn-end'));
});

test('Lost in the Crowd: off-guard to the caster (PF2e\'s Off-Guard on a critical failure), can\'t flank until it Seeks', () => {
    const plan = compile('Lost in the Crowd');
    assert.equal(inspectSavePlan(plan).supported, true);
    const [offGuard, flank] = plan.resolution.outcomes.failure.noteEffects;
    assert.deepEqual(offGuard.rules[0].predicate, ['origin:signature:{caster-signature}']);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].rules[0].key, 'GrantItem');
    assert.deepEqual(flank.disbelieve, {statistic: 'perception', endsSpell: false, needs: 'success'});
    assert.ok([offGuard, flank].every(validNoteEffect));
});

test('Judge Soul: void (vitality for void healing) over the item\'s type, death at 0 HP, Drained increased, the repeats ending on a success', () => {
    const plan = compile('Judge Soul');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.damageTypeFrom.type, 'void');
    assert.equal(plan.resolution.damageSwap.to, 'vitality');
    assert.equal(plan.resolution.postDamageTerminal.kind, 'death');
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.conditionIncreases.map(entry => `${entry.slug}+${entry.amount}`), ['drained+2']);
    assert.ok(isConditionIncreases(plan.resolution.outcomes.failure.conditionIncreases));
    assert.deepEqual(Object.entries(plan.resolution.outcomes).filter(([, outcome]) => outcome.endsRepeat).map(([degree]) => degree), ['criticalSuccess', 'success']);
});
