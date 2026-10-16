import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {extractScopedConditionReferences} from '../src/compiler/description-parser.js';
import {parseConditionLists} from '../src/compiler/condition-list-lifetime.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {analyzeResidualProse} from '../src/compiler/residual-prose.js';
import {inspectSavePlan, isEscapeLifetime, executableConditionLinks} from '../scripts/basic-save-core.js';
import {escapeCheck, escapeDegree, gradeEscapeCandidates} from '../scripts/escape-termination.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const LINK = (id, label) => `@UUID[Compendium.pf2e.conditionitems.Item.${id}]{${label}}`;
const view = effects => effects.map(effect => [effect.slug, effect.value, effect.duration?.value ?? effect.duration?.mode ?? null,
    effect.duration?.unit ?? null, (effect.endsWhen ?? []).map?.(event => event.event).join('+') || null, effect.expirationMode ?? null]);

function detached(original, name = 'Custom Restraint', description = original.system.description.value) {
    const item = structuredClone(original);
    item._id = 'custom-restraint-copy';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('Grasping Grave composes damage, a Speed penalty and a timer-or-Escape Immobilized', async () => {
    const plan = compileAbility(await fixture('rank-5/grasping-grave.json'));
    assert.deepEqual(validateAbilityPlan(plan), []);
    assert.deepEqual(inspectSavePlan(plan), {supported: true, route: 'degree-save', blockers: []});
    const outcomes = plan.resolution.outcomes;
    assert.equal(outcomes.failure.modifiers[0].value, -10);
    assert.deepEqual(view(outcomes.criticalFailure.effects), [['immobilized', null, 1, 'rounds', 'escape', 'first']]);
    assert.deepEqual(outcomes.criticalFailure.effects[0].endsWhen, [{event: 'escape', dc: 'spell'}]);
    assert.equal(isEscapeLifetime(outcomes.criticalFailure.effects[0]), true);
});

test('Shadow\'s Web scopes each list item: valued Stunned, timed enfeebled, and Escape only on Immobilized', async () => {
    const plan = compileAbility(await fixture('rank-7/shadows-web.json'));
    assert.deepEqual(inspectSavePlan(plan).supported, true);
    assert.deepEqual(view(plan.resolution.outcomes.criticalFailure.effects), [
        ['stunned', 1, null, null, null, null],
        ['immobilized', null, 1, 'rounds', 'escape', 'first'],
        ['enfeebled', 2, 1, 'rounds', null, 'duration']
    ]);
    assert.deepEqual(view(plan.resolution.outcomes.failure.effects), [['enfeebled', 2, 1, 'rounds', null, 'duration']]);
});

test('detached renamed copies compile the same Escape lifetimes without identity dispatch', async () => {
    for (const path of ['rank-5/grasping-grave.json', 'rank-7/shadows-web.json']) {
        const original = compileAbility(await fixture(path));
        const copy = compileAbility(detached(await fixture(path)));
        assert.equal(inspectSavePlan(copy).supported, true, path);
        for (const degree of Object.keys(original.resolution.outcomes)) {
            assert.deepEqual(view(copy.resolution.outcomes[degree].effects), view(original.resolution.outcomes[degree].effects), `${path} ${degree}`);
        }
    }
});

test('an Escape clause never leaks to a condition outside its list run', () => {
    const text = `The creature is ${LINK('a', 'Stunned 1')}. It is ${LINK('b', 'Immobilized')} for 1 round or until it Escapes.`;
    const refs = extractScopedConditionReferences(text);
    assert.equal(refs.find(ref => ref.slug === 'stunned').lifetimeProof.escape, false);
    assert.equal(refs.find(ref => ref.slug === 'immobilized').lifetimeProof.escape, true);
    const shared = parseConditionLists(`The target is dazzled, ${LINK('c', 'Enfeebled 2')}, and ${LINK('d', 'Immobilized')} for 1 minute or until they Escape.`);
    assert.deepEqual(shared.map(item => [item.slug, item.lifetime.duration.value, item.lifetime.escape]),
        [['dazzled', 1, true], ['enfeebled', 1, true], ['immobilized', 1, true]]);
    const prone = parseConditionLists(`The target is knocked prone and ${LINK('e', 'Grabbed')} until it Escapes or the spell ends.`);
    assert.equal(prone.find(item => item.slug === 'prone').lifetime, null, 'Prone ends by Standing, not by Escape');
});

test('list grammar rejects caster subjects, negation and ordinary words', () => {
    assert.deepEqual(parseConditionLists('You are Confused for 1 round.'), []);
    assert.deepEqual(parseConditionLists('The target isn\'t knocked prone and stunned for 1 round.'), []);
    assert.deepEqual(parseConditionLists('Their life force is drained away through their dreams.'), []);
    assert.deepEqual(parseConditionLists('The target is controlled by you and follows your orders.'), []);
    assert.deepEqual(parseConditionLists('The creature is stunned for 1 round and blinded for 1 minute.')
        .map(item => [item.slug, item.lifetime.duration.value, item.lifetime.duration.unit]),
    [['stunned', 1, 'rounds'], ['blinded', 1, 'minutes']]);
});

test('a dropped coordinated condition keeps the outcome unaccounted', async () => {
    const plan = compileAbility(await fixture('rank-7/shadows-web.json'));
    const outcome = structuredClone(plan.resolution.outcomes.criticalFailure);
    assert.equal(analyzeResidualProse(outcome, {degree: 'criticalFailure'}).fullyCompiled, true);
    outcome.effects = outcome.effects.filter(effect => effect.slug !== 'enfeebled');
    const coverage = analyzeResidualProse(outcome, {degree: 'criticalFailure'});
    assert.equal(coverage.fullyCompiled, false);
    assert.ok(coverage.clauses.some(clause => clause.unexplainedSignals.includes('listed-condition')));
});

test('only an exact single spell-DC Escape event executes', () => {
    const base = {kind: 'condition', slug: 'immobilized', value: null,
        duration: {mode: 'fixed', value: 1, unit: 'rounds', expiry: 'turn-start', anchor: 'effect-start'},
        endsWhen: [{event: 'escape', dc: 'spell'}], expirationMode: 'first'};
    assert.ok(executableConditionLinks([base]));
    assert.ok(executableConditionLinks([{...base, duration: null, expirationMode: 'event'}]));
    for (const broken of [
        {...base, endsWhen: [{event: 'escape'}]},
        {...base, endsWhen: [{event: 'escape', dc: 'spell'}, {event: 'spell-ended'}]},
        {...base, endsWhen: [{event: 'escape', dc: 'spell', extra: true}]},
        {...base, expirationMode: 'event'},
        {...base, duration: {mode: 'text'}},
        {...base, endsWhen: {event: 'escape', dc: 'spell'}}
    ]) assert.equal(executableConditionLinks([broken]), null, JSON.stringify(broken));
});

test('Escape checks are graded against each restraint\'s snapshotted DC with natural 20/1 steps', () => {
    assert.equal(escapeDegree(25, 10, 25), 'success');
    assert.equal(escapeDegree(24, 10, 25), 'failure');
    assert.equal(escapeDegree(35, 10, 25), 'criticalSuccess');
    assert.equal(escapeDegree(24, 20, 25), 'success');
    assert.equal(escapeDegree(25, 1, 25), 'failure');
    const message = {flags: {pf2e: {context: {options: ['action:escape', 'action:escape:athletics'], origin: {actor: 'Actor.x'}}}},
        rolls: [{total: 22, dice: [{total: 14}]}], speaker: {actor: 'x'}};
    assert.deepEqual(escapeCheck(message), {action: 'escape', total: 22, natural: 14, reroll: false, actorUuid: 'Actor.x', speakerActorId: 'x'});
    // A Grapple is read too, but ends only an Effect that says a Grapple ends it (Tenebrous Freedom's shadow); never an Escape's.
    const grapple = {...message, flags: {pf2e: {context: {options: ['action:grapple']}}}};
    assert.equal(escapeCheck(grapple).action, 'grapple');
    assert.equal(escapeCheck({...message, flags: {pf2e: {context: {options: ['action:trip']}}}}), null);
    const effect = (dc, extra = {}) => ({type: 'effect', isExpired: false, flags: {'pf2e-automatic-resolution': {outcomeEffect: {castId: 'c', escape: {dc}}}}, ...extra});
    const graded = gradeEscapeCandidates([effect(20), effect(23), effect(21, {isExpired: true}),
        {type: 'effect', flags: {}}, {type: 'condition', flags: {'pf2e-automatic-resolution': {outcomeEffect: {escape: {dc: 1}}}}}], escapeCheck(message));
    assert.deepEqual(graded.map(entry => [entry.escape.dc, entry.degree, entry.escaped]), [[20, 'success', true], [23, 'failure', false]]);
    const shadow = {type: 'effect', isExpired: false, flags: {'pf2e-automatic-resolution': {outcomeEffect: {castId: 'c', escape: {dc: 20, check: 'grapple'}}}}};
    assert.deepEqual(gradeEscapeCandidates([effect(20), shadow], escapeCheck(grapple)).map(entry => entry.effect), [shadow]);
    assert.deepEqual(gradeEscapeCandidates([effect(20), shadow], escapeCheck(message)).map(entry => entry.escape.check ?? null), [null]);
});
