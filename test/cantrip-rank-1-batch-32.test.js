import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {adaptSpellSource} from '../src/compiler/spell-source-adapter.js';
import {degreeAdjustmentFor, inspectSavePlan, isDegreeAdjustment} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
const actor = traits => ({ system: { traits: { value: traits } }, traits: new Set(traits) });

test('Parch: a mislabelled basic flag, a checks-and-DCs penalty, Dazzled while penalised, and a trait-or-GM degree shift', async () => {
    const source = await spell('rank-1/parch');
    assert.deepEqual(adaptSpellSource(source).defense, {kind: 'save', statistic: 'fortitude', basic: false, basicFlagIgnored: true});
    const parch = compileAbility(source);
    assert.equal(inspectSavePlan(parch).supported, true, JSON.stringify(inspectSavePlan(parch).blockers));
    const {success, failure, criticalFailure} = parch.resolution.outcomes;
    const note = failure.noteEffects[0];
    assert.deepEqual([note.label, note.rules, note.duration.value, note.duration.unit], ['Checks and DCs penalty', [{key: 'FlatModifier', selector: 'all', type: 'status', value: -1}], 1, 'minutes']);
    assert.deepEqual([success.noteEffects[0].duration.value, success.noteEffects[0].duration.unit], [1, 'rounds']);
    assert.equal(criticalFailure.noteEffects[0].rules[0].value, -2);
    // "… and is Dazzled as long as it has this penalty.": Dazzled for the penalty's minute.
    assert.deepEqual([criticalFailure.effects[0].slug, criticalFailure.effects[0].duration.value, criticalFailure.effects[0].duration.unit], ['dazzled', 1, 'minutes']);
    // The ways it ends early ride on the note.
    assert.match(note.text, /drinks a liquid.*the spell ends\. .*two-action activity/);
    assert.ok(validNoteEffect(note));
    const effect = prepareNoteEffectSource(note, {castId: 'c', castRank: 1, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'Parch', targetActorUuid: 'T'});
    assert.deepEqual(effect.system.rules, [{key: 'FlatModifier', selector: 'all', type: 'status', value: -1, label: 'Parch'}]);
    // Water creatures shift a degree worse by trait; a creature made of liquid is the GM's answer.
    const shift = parch.resolution.degreeAdjustment;
    assert.ok(isDegreeAdjustment(shift));
    assert.deepEqual(shift.predicate.traits, ['water']);
    assert.equal(degreeAdjustmentFor(shift, actor(['water', 'elemental'])).status, 'applies');
    const other = degreeAdjustmentFor(shift, actor(['humanoid']));
    assert.equal(other.status, 'pending');
    assert.match(other.question, /primarily of liquid/);
    // The moisture immunity is the GM's eligibility question.
    assert.match(parch.targeting.actorConstraints.predicates[0].question, /moisture/);
});

test('mislabelled basic flag and new rules: kept strict', async () => {
    const source = await spell('rank-1/parch');
    // A text that says "basic", or has damage, keeps PF2e's flag.
    assert.equal(adaptSpellSource(withText(source, text => text.replace('attempt a Fortitude save', 'attempt a basic Fortitude save'))).defense.basic, true);
    const damaged = structuredClone(source); damaged.system.damage = {a: {formula: '1d4', type: 'fire', category: null, kinds: ['damage']}};
    assert.equal(adaptSpellSource(damaged).defense.basic, true);
    // A condition "as long as" a different penalty, or a second condition, isn't scoped.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('as long as it has this penalty', 'as long as it stays in the area')))).supported, false);
    // A shift for an unknown trait word stays unread.
    assert.equal(inspectSavePlan(compileAbility(withText(source, text => text.replace('has the water trait', 'has the wet trait')))).supported, false);
    // An unknown predicate kind is refused.
    assert.equal(isDegreeAdjustment({predicate: {kind: 'trait-or-gm-confirmed', traits: ['water']}, map: {criticalSuccess: 'success', success: 'failure', failure: 'criticalFailure', criticalFailure: 'criticalFailure'}, sourceText: 'x'}), false);
});

test('a sentence ending the effect early is a rule, not narration', async () => {
    // "The spell ends for a creature when its persistent damage ends." is a named gap outside the persistent follow-up form (batch 128 compiles
    // Dehydrate itself: the additional save at the end of each turn). Here the additional save comes at the start of each turn, which isn't read.
    const dehydrate = compileAbility(withText(await spell('rank-1/dehydrate'), text => text.replace('at the end of each of its turns', 'at the start of each of its turns')));
    assert.ok(dehydrate.automation.pendingCapabilities.includes('preamble:ends-early'));
});
