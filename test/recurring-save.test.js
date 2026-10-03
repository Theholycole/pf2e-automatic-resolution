import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {parseRecurringSave} from '../src/compiler/recurring-save-lifetime.js';
import {inspectSavePlan, executableConditionLinks, isRecurringSaveLifetime} from '../scripts/basic-save-core.js';
import {recurringSaveResult} from '../scripts/recurring-save-recovery.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const view = effects => effects.map(effect => [effect.slug, effect.value, effect.duration?.value ?? null, effect.duration?.unit ?? null, effect.recurringSave?.mode ?? null]);

function detached(original, description = original.system.description.value, name = 'Custom Recurring Spell') {
    const item = structuredClone(original);
    item._id = 'custom-recurring-01';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('Confusion: failure ends on a recurring Will save; the explicit critical failure has none', async () => {
    const plan = compileAbility(await fixture('rank-4/confusion.json'));
    assert.deepEqual(validateAbilityPlan(plan), []);
    assert.deepEqual(inspectSavePlan(plan), {supported: true, route: 'degree-save', blockers: []});
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(view(outcomes.success.effects), [['stunned', 1, null, null, null]]);
    assert.deepEqual(view(outcomes.failure.effects), [['confused', null, 1, 'minutes', 'end']]);
    assert.deepEqual(outcomes.failure.effects[0].recurringSave,
        {timing: 'turn-end', mode: 'end', statistic: 'will', sourceText: 'It can attempt a new save at the end of each of its turns to end the confusion.'});
    assert.deepEqual(view(outcomes.criticalFailure.effects), [['confused', null, 1, 'minutes', null]]);
});

test('Paralyze: the critical failure timer shortens on a success and ends on a critical success', async () => {
    const plan = compileAbility(await fixture('rank-3/paralyze.json'));
    assert.deepEqual(inspectSavePlan(plan).supported, true);
    assert.equal(plan.lifecycle.durationSpec.mode, 'outcome');
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(view(outcomes.failure.effects), [['paralyzed', null, 1, 'rounds', null]]);
    assert.deepEqual(view(outcomes.criticalFailure.effects), [['paralyzed', null, 4, 'rounds', 'reduce']]);
});

test('detached renamed copies compile identical recurring lifetimes', async () => {
    for (const path of ['rank-4/confusion.json', 'rank-3/paralyze.json']) {
        const original = compileAbility(await fixture(path)), copy = compileAbility(detached(await fixture(path)));
        assert.equal(inspectSavePlan(copy).supported, true, path);
        for (const degree of Object.keys(original.resolution.outcomes)) {
            assert.deepEqual(view(copy.resolution.outcomes[degree].effects), view(original.resolution.outcomes[degree].effects), `${path} ${degree}`);
        }
    }
});

test('inherited recurring saves are removed only by that degree\'s explicit negation', async () => {
    const source = await fixture('rank-4/confusion.json');
    const inherited = compileAbility(detached(source, source.system.description.value
        .replace(/<strong>Critical Failure<\/strong>[^<]*/, '<strong>Critical Failure</strong> As failure, but the target gets no save to end the effect early.')));
    assert.deepEqual(view(inherited.resolution.outcomes.criticalFailure.effects), [['confused', null, 1, 'minutes', null]]);
    assert.equal(inspectSavePlan(inherited).supported, true);
    const kept = compileAbility(detached(source, source.system.description.value
        .replace(/<strong>Critical Failure<\/strong>[^<]*/, '<strong>Critical Failure</strong> As failure.')));
    assert.deepEqual(view(kept.resolution.outcomes.criticalFailure.effects), [['confused', null, 1, 'minutes', 'end']]);
});

test('unproven recurring-save scope stays residual', async () => {
    const source = await fixture('rank-4/confusion.json');
    for (const [label, from, to] of [
        ['wrong condition noun', 'to end the confusion', 'to end the paralysis'],
        ['wrong statistic', 'a new save at the end', 'a new Fortitude save at the end'],
        ['extra condition clause', 'to end the confusion.', 'to end the confusion and becomes slowed 1.'],
        ['start of turn', 'at the end of each of its turns', 'at the start of each of its turns']
    ]) {
        const plan = compileAbility(detached(source, source.system.description.value.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported, false, label);
        assert.equal(plan.resolution.outcomes.failure.effects.some(effect => effect.recurringSave), false, label);
    }
    assert.deepEqual(parseRecurringSave('It can attempt a new save at the end of each of its turns to end the confusion. It can attempt a new save at the end of each of its turns to end the confusion.', {statistic: 'will'}), {ambiguous: true});
});

test('reduce mode requires one shared whole-rounds timer', () => {
    const base = {kind: 'condition', slug: 'paralyzed', value: null,
        duration: {mode: 'fixed', value: 4, unit: 'rounds', expiry: 'turn-start', anchor: 'effect-start'},
        recurringSave: {timing: 'turn-end', mode: 'reduce', statistic: 'will', sourceText: 'x'}};
    assert.ok(executableConditionLinks([base]));
    assert.ok(executableConditionLinks([{...base, duration: {mode: 'fixed', value: 1, unit: 'minutes'}, recurringSave: {...base.recurringSave, mode: 'end'}}]));
    for (const broken of [
        {...base, duration: {mode: 'fixed', value: 1, unit: 'minutes'}},
        {...base, recurringSave: {...base.recurringSave, timing: 'turn-start'}},
        {...base, recurringSave: {...base.recurringSave, statistic: 'perception'}},
        {...base, recurringSave: {...base.recurringSave, extra: true}},
        {...base, endsWhen: [{event: 'escape', dc: 'spell'}], expirationMode: 'first'},
        {...base, recurringSave: {...base.recurringSave, mode: 'end'}, duration: null}
    ]) assert.equal(executableConditionLinks([broken]), null, JSON.stringify(broken));
    assert.equal(isRecurringSaveLifetime(base), true);
});

test('recurring save outcomes: end, reduce by one round, and critical success', () => {
    assert.deepEqual(recurringSaveResult('end', 'success'), {end: true});
    assert.deepEqual(recurringSaveResult('end', 'criticalSuccess'), {end: true});
    assert.deepEqual(recurringSaveResult('end', 'failure'), {end: false});
    assert.deepEqual(recurringSaveResult('reduce', 'success', 4), {end: false, rounds: 3});
    assert.deepEqual(recurringSaveResult('reduce', 'success', 1), {end: true});
    assert.deepEqual(recurringSaveResult('reduce', 'criticalSuccess', 4), {end: true});
    assert.deepEqual(recurringSaveResult('reduce', 'criticalFailure', 4), {end: false});
    assert.throws(() => recurringSaveResult('reduce', 'success', null));
});

test('unproven degree shifts in the preamble block; proven ones compile', async () => {
    const plan = compileAbility(await fixture('rank-4/spiritual-anamnesis.json'));
    assert.equal(plan.resolution.degreeAdjustment.predicate.kind, 'gm-confirmed');
    assert.deepEqual(plan.resolution.degreeAdjustment.map, {criticalSuccess: 'success', success: 'success', failure: 'criticalFailure', criticalFailure: 'criticalFailure'});
    const source = await fixture('rank-4/spiritual-anamnesis.json');
    const reworded = compileAbility(detached(source, source.system.description.value.replace('they get a critical failure instead', 'they get a critical failure instead unless they are asleep')));
    assert.ok(reworded.automation.pendingCapabilities.includes('preamble:degree-adjustment'));
    assert.equal(inspectSavePlan(reworded).supported, false);
});

test('"You can Dismiss the spell." compiles cast-wide caster dismissal; other Dismiss wording blocks', async () => {
    const source = await fixture('rank-4/confusion.json');
    const plan = compileAbility(source);
    assert.deepEqual(plan.lifecycle.dismissal, {authority: 'source-actor', scope: 'cast', action: 'Dismiss', sourceText: 'You can Dismiss the spell.'});
    assert.equal(inspectSavePlan(plan).supported, true);
    const veil = compileAbility(detached(source, source.system.description.value.replace('You can Dismiss the spell.', 'You can Dismiss the veil.')));
    assert.ok(veil.automation.pendingCapabilities.includes('dismissal'));
    assert.equal(inspectSavePlan(veil).supported, false);
    const forged = structuredClone(plan);
    forged.lifecycle.dismissal = {...plan.lifecycle.dismissal, authority: 'target'};
    assert.equal(inspectSavePlan(forged).supported, false);
});

test('degree adjustments apply to the raw roll per target, and GM questions gate Finalize', async () => {
    const {applyDegreeAdjustment, degreeAdjustmentFor, recordProvisionalSave, correctSaveTarget, saveCollectionReadiness} = await import('../scripts/basic-save-core.js');
    const wheeze = compileAbility(await fixture('rank-1/gritty-wheeze.json')).resolution.degreeAdjustment;
    const plant = {traits: new Set(['plant'])}, human = {traits: new Set(['humanoid'])};
    const state = {status: 'collecting', degreeAdjustment: wheeze, targets: [
        {id: 'p', eligible: true, applicationStatus: 'pending', revision: 0, degreeAdjustment: degreeAdjustmentFor(wheeze, plant)},
        {id: 'h', eligible: true, applicationStatus: 'pending', revision: 0, degreeAdjustment: degreeAdjustmentFor(wheeze, human)}]};
    recordProvisionalSave(state, 'p', {degree: 'success', timestamp: 1});
    recordProvisionalSave(state, 'h', {degree: 'success', timestamp: 1});
    assert.deepEqual(state.targets.map(t => [t.rolledDegree, t.degree]), [['success', 'failure'], ['success', 'success']]);
    const anamnesis = compileAbility(await fixture('rank-4/spiritual-anamnesis.json')).resolution.degreeAdjustment;
    const gm = {status: 'collecting', degreeAdjustment: anamnesis, targets: [{id: 'u', eligible: true, applicationStatus: 'pending', revision: 0,
        degreeAdjustment: degreeAdjustmentFor(anamnesis, plant)}]};
    recordProvisionalSave(gm, 'u', {degree: 'failure', timestamp: 1});
    assert.equal(gm.targets[0].degree, 'failure');
    assert.equal(saveCollectionReadiness(gm).ready, false);
    correctSaveTarget(gm, 'u', {action: 'adjustment-applies'}, 'gm');
    assert.equal(gm.targets[0].degree, 'criticalFailure');
    assert.equal(saveCollectionReadiness(gm).ready, true);
    correctSaveTarget(gm, 'u', {action: 'degree', degree: 'success'}, 'gm');
    applyDegreeAdjustment(gm, gm.targets[0]);
    assert.equal(gm.targets[0].degree, 'success', 'a GM degree override is final');
});
