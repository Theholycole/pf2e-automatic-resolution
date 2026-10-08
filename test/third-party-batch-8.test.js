import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {executableCasterChoice, inspectSavePlan, isCasterConditionOnly, targetOutcomeNotes} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 8 (2026-10-06): The End is Nigh (the caster's Frightened, a misfortune note with a frightened floor), Sensory Deprivation (the caster's
// pick, two on a critical failure; spells with the restricted trait refused), Bewilder (a GM-played note, the failure's end-of-turn save).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('The End is Nigh: the caster\'s Frightened 1; the misfortune note with the floor; Frightened 3 and Fleeing on a critical failure', () => {
    const plan = compile('The End is Nigh');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(isCasterConditionOnly(plan.resolution.outcomes.criticalSuccess));
    const note = plan.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual(note.conditionFloor, {slug: 'frightened', value: 1});
    assert.deepEqual(note.rules[0].selector, ['attack-roll', 'saving-throw']);
    assert.ok(validNoteEffect(note));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug}:${effect.value}`), ['frightened:3', 'fleeing:null']);
    assert.equal(plan.resolution.temporaryImmunity.duration.value, 10);
});

test('Sensory Deprivation: one pick (two on a critical failure), each a note for the row\'s time', () => {
    const plan = compile('Sensory Deprivation');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.ok(executableCasterChoice(plan));
    const state = {casterChoice: {...plan.resolution.casterChoice, selected: 'hands', also: 'eyes'}, outcomes: plan.resolution.outcomes};
    const picked = degree => targetOutcomeNotes(state, {degree}).map(note => note.option);
    assert.deepEqual(picked('success'), ['hands']);
    assert.deepEqual(picked('criticalFailure').sort(), ['eyes', 'hands']);
    assert.deepEqual(plan.resolution.outcomes.success.noteEffects.find(note => note.option === 'hands').castForbid, {trait: 'manipulate'});
});

test('Bewilder: the GM-played note; the failure\'s end-of-turn Will save; DC 11 on a critical failure', () => {
    const plan = compile('Bewilder');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects[0].recurringSave, {timing: 'turn-end', mode: 'end', statistic: 'will'});
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /DC 11 flat check/);
    for (const degree of ['success', 'failure', 'criticalFailure']) assert.ok(validNoteEffect(plan.resolution.outcomes[degree].noteEffects[0]));
});
