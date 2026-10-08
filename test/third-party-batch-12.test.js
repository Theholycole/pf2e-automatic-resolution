import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 12 (2026-10-06): Ruler of Everything (the immunity, the GM's nobility bonus, Prone and the behaviour notes), Web of Darkness (the Speed
// penalties, the strands at the cast rank, Immobilized for the spell), Divine Adjudication (the damage rows; the caster's bonus the GM's note).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});

test('Ruler of Everything: immune for 10 minutes; +2 for nobility (the GM\'s); Prone on each failing row with its note', () => {
    const plan = compile('Ruler of Everything');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 10, unit: 'minutes'});
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [2, 0]);
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => plan.resolution.outcomes[degree].effects[0].slug === 'prone' && validNoteEffect(plan.resolution.outcomes[degree].noteEffects[0])));
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /can't Stand/);
});

test('Web of Darkness: −5 and −10 to Speeds for the spell; the strands\' AC and HP at the cast rank; Immobilized for the spell', () => {
    const plan = compile('Web of Darkness');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure'].map(degree => plan.resolution.outcomes[degree].noteEffects[0].rules[0].value), [-5, -10]);
    globalThis.fromUuidSync ??= () => null;
    const source = prepareNoteEffectSource(plan.resolution.outcomes.criticalFailure.noteEffects[0], {castId: 'c', sourceActorUuid: 'Actor.a', targetActorUuid: 'Actor.b', sourceItemName: 'Web of Darkness', castRank: 8});
    assert.match(source.system.description.value, /AC 36 and 40 Hit Points/);
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].duration.mode, 'sustained');
});

test("Divine Adjudication: half, full, double damage; the caster's conditional bonus a GM note for the minute", () => {
    const plan = compile('Divine Adjudication');
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [0.5, 1, 2]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].duration.value, 10);
});
