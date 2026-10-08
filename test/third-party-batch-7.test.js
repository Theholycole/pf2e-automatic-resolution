import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 7 (2026-10-06): weakness and persistent damage from the text — Hemophilia (weakness by rank, drained once on the first bleed), Creeping
// Cold (the text's persistent cold, a penalty while it lasts), Ravaging End (the caster's type for both parts, the persistent damage held by the spell's note).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Hemophilia: weakness to bleed at the rank (doubled on a critical failure); drained +1 the first time it bleeds', () => {
    const plan = compile('Hemophilia');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects[0].rules[0].value), ['@item.level', '@item.level', '@item.level*2']);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects[0].triggeredIncrease, {slug: 'drained', maximum: 4, trigger: 'took bleed damage for the first time', once: true});
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].triggeredIncrease, undefined);
    assert.match(plan.resolution.dataNotes.at(-1), /matches the text/);
    for (const degree of ['success', 'failure', 'criticalFailure']) assert.ok(validNoteEffect(plan.resolution.outcomes[degree].noteEffects[0]));
});

test('Creeping Cold: the text\'s persistent cold at the rank, halved on a success; the Reflex penalty while it lasts', () => {
    const plan = compile('Creeping Cold');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.sharedDamage.formula, '(1+floor((@item.rank - 1)/1)*1)d6[persistent,cold]');
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [0.5, 1, 1]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].whilePersistent, 'cold');
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].rules[0].value, -2);
});

test('Ravaging End: both parts of the caster\'s type; the note holds the persistent damage at the row\'s recovery DC', () => {
    const plan = compile('Ravaging End');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(executableCasterChoice(plan));
    assert.deepEqual(plan.resolution.casterChoice.values, ['acid', 'fire', 'poison']);
    assert.equal(plan.resolution.sharedDamage.formula, '{(1+floor((@item.rank - 1)/1)*1)d4[untyped],(2+floor((@item.rank - 1)/1)*2)[persistent,untyped]}');
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects[0].holdsPersistent.dc), [15, 15, 17]);
});
