import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {moduleEffectAt, sameStatedRules} from '../src/compiler/third-party-rows.js';
import {compileSaveAdjustment} from '../src/compiler/save-preamble.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 3 (2026-10-06): rows read from the text into generated Effects; the modules' own Effects checked against them.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name));
const byId = new Map(items.map(item => [item._id, item]));
// (The modules' Effects, as the census tool's catalog has them.)
const catalog = new Map(items.filter(item => item.type === 'effect').flatMap(effect => {
    const profile = {id: effect._id, name: effect.name, type: 'effect', automation: {ruleKeys: [], requiresConfiguration: true, removesAfterRoll: false},
        mechanics: {rules: effect.system.rules ?? [], duration: effect.system.duration ?? null, start: null}};
    return [[effect.name, profile], [effect._id, profile]];
}));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: catalog, referencedSpells: new Map()});
const notes = (plan, degree) => plan.resolution.outcomes[degree].noteEffects ?? [];

test("Cursed Mark: the next saving throw rolled twice, the mark's time by degree", () => {
    const plan = compile('Cursed Mark');
    assert.deepEqual(notes(plan, 'success')[0].rules, [{key: 'RollTwice', selector: 'saving-throw', keep: 'lower', removeAfterRoll: true}]);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => `${notes(plan, degree)[0].duration.value} ${notes(plan, degree)[0].duration.unit}`), ['1 rounds', '1 minutes', '1 minutes']);
    assert.match(notes(plan, 'criticalFailure')[0].text, /2 Interact actions/);
    for (const degree of ['success', 'failure', 'criticalFailure']) assert.ok(validNoteEffect(notes(plan, degree)[0]));
});

test("Demand Compliance: the penalty by degree, the demand on failing rows, the module's Effect checked", () => {
    const plan = compile('Demand Compliance');
    assert.deepEqual(notes(plan, 'success')[0].rules.map(rule => `${rule.selector}:${rule.value}`), ['attack-roll:-1', 'saving-throw:-1', 'skill-check:-1']);
    assert.equal(notes(plan, 'success')[0].duration.anchor, 'target-turn');
    assert.deepEqual(notes(plan, 'criticalFailure')[0].rules.map(rule => rule.value), [-2, -2, -2]);
    assert.equal(notes(plan, 'failure')[1].label, 'Demand');
    assert.equal(notes(plan, 'success').length, 1);
    // (Its Effect offers "-1"/"-2", not degrees: a choice made by hand.)
    assert.match(plan.resolution.dataNotes.at(-1), /doesn't pick its rules by the save's degree/);
    for (const degree of ['success', 'failure', 'criticalFailure']) for (const note of notes(plan, degree)) assert.ok(validNoteEffect(note));
});

test("Golden Touch: weakness at the rank, doubled; the module's Effect matches at every degree", () => {
    const plan = compile('Golden Touch');
    assert.deepEqual(notes(plan, 'success')[0].rules[0], {key: 'Weakness', type: ['bludgeoning', 'electricity'], value: '@item.level'});
    assert.equal(notes(plan, 'failure')[0].rules[0].value, '@item.level*2');
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['slowed', 'petrified']);
    assert.deepEqual(plan.compilerEvidence.moduleEffectChecks[0].agrees, ['success', 'failure', 'criticalFailure']);
    for (const degree of ['success', 'failure', 'criticalFailure']) assert.ok(validNoteEffect(notes(plan, degree)[0]));
});

test("the module Effect reader: labelled flags, object values, eq predicates", () => {
    const creeping = byId.get('QEhUuvwX5nWeoWS9').system.rules;
    const success = moduleEffectAt(creeping, 'success', {rank: 1});
    assert.deepEqual(success.active.map(rule => `${rule.key}:${rule.value ?? ''}`), ['GrantItem:', 'FlatModifier:-1']);
    assert.equal(moduleEffectAt(creeping, 'criticalFailure', {rank: 1}).active.find(rule => rule.key === 'FlatModifier').value, -2);
    const web = byId.get('mOwOxk8Uwyz8hra5').system.rules;
    assert.equal(moduleEffectAt(web, 'failure', {rank: 6}).active[0].value, -10);
    assert.equal(moduleEffectAt(web, 'criticalFailure', {rank: 6}).offered, false);
    assert.ok(sameStatedRules([{key: 'Weakness', type: 'bleed', value: 2}], [{key: 'Weakness', type: ['bleed'], value: '@item.level*2'}], 1));
    assert.ok(!sameStatedRules([{key: 'Weakness', type: 'bleed', value: 2}], [{key: 'Weakness', type: ['bleed'], value: '@item.level'}], 1));
});

test("Hand of Judgement's save penalty asked of the GM; Grand Finale's later dazzled and its reminder", () => {
    const judgement = compileSaveAdjustment('<p>The target must attempt a Will save. If the target has broken the laws of the area you are currently in within the last week they take a –2 circumstance penalty to their save.</p><p><strong>Success</strong> x</p>', 'will');
    assert.equal(judgement.choices[0].value, -2);
    const finale = compile('Grand Finale');
    const dazzled = finale.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'dazzled');
    assert.equal(dazzled.duration.value, 11);
    assert.equal(finale.resolution.reminders[0].kind, 'required-spell');
});
