import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {validateAbilityPlan} from '../src/compiler/validate-plan.js';
import {parseConditionLists} from '../src/compiler/condition-list-lifetime.js';
import {compileStateImmunity} from '../src/compiler/save-preamble.js';
import {correctSaveTarget, executableConditionLinks, inspectSavePlan, isActionEndLifetime,
    saveCollectionReadiness, validateActorTarget} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const view = effects => effects.map(effect => [effect.slug, effect.duration?.value ?? effect.duration?.mode ?? null,
    (effect.endsWhen ?? []).map?.(event => event.action ?? event.event).join('+') || null, effect.expirationMode ?? null]);

function detached(original, description = original.system.description.value, name = 'Custom Self Help') {
    const item = structuredClone(original);
    item._id = 'custom-self-help01';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('Interact ends only the named condition, alone or first-of with its timer', async () => {
    const flash = compileAbility(await fixture('rank-1/dazzling-flash.json'));
    assert.deepEqual(validateAbilityPlan(flash), []);
    assert.equal(inspectSavePlan(flash).supported, true);
    assert.deepEqual(view(flash.resolution.outcomes.failure.effects), [['blinded', 1, 'interact', 'first'], ['dazzled', 1, null, 'duration']]);
    assert.deepEqual(view(flash.resolution.outcomes.criticalFailure.effects), [['blinded', 1, null, 'duration'], ['dazzled', 1, null, 'duration']]);
    const spit = compileAbility(await fixture('rank-1/slime-spit.json'));
    assert.equal(inspectSavePlan(spit).supported, true);
    assert.deepEqual(view(spit.resolution.outcomes.success.effects), [['dazzled', 1, 'interact', 'first']]);
    assert.deepEqual(view(spit.resolution.outcomes.criticalFailure.effects), [['blinded', 1, null, 'duration'], ['dazzled', null, 'interact', 'event']]);
});

test('Escape phrased as "can attempt to Escape with an Escape DC equal to your spell DC"', async () => {
    const plan = compileAbility(await fixture('rank-4/grasp-of-the-deep.json'));
    assert.equal(inspectSavePlan(plan).supported, true);
    for (const degree of ['failure', 'criticalFailure']) {
        assert.deepEqual(plan.resolution.outcomes[degree].effects[0].endsWhen, [{event: 'escape', dc: 'spell'}], degree);
        assert.equal(plan.resolution.outcomes[degree].effects[0].expirationMode, 'event', degree);
    }
});

test('Interact wording outside a proven scope stays residual', async () => {
    const flash = await fixture('rank-1/dazzling-flash.json');
    const unnamed = compileAbility(detached(flash, flash.system.description.value.replace('to end the Blinded condition', 'to end the Deafened condition')));
    assert.equal(inspectSavePlan(unnamed).supported, false);
    assert.deepEqual(parseConditionLists('The target is dazzled until it uses an Interact action to wipe its eyes and heal itself fully for a day, maybe.')
        .map(item => item.lifetime?.actionEnd ?? null), [null]);
});

test('creature-state immunity compiles to a GM confirmation that blocks Finalize until answered', async () => {
    const plan = compileAbility(await fixture('rank-8/boil-blood.json'));
    assert.deepEqual(validateAbilityPlan(plan), []);
    assert.equal(inspectSavePlan(plan).supported, true);
    const predicate = plan.targeting.actorConstraints.predicates.find(entry => entry.kind === 'gm-confirmed');
    assert.match(predicate.question, /blood/);
    assert.equal(compileStateImmunity('<p>A creature that doesn\'t breathe is immune to this effect.</p>'), null, '"this effect" scope is ambiguous');
    const eligibility = validateActorTarget({...plan.targeting.actorConstraints}, {type: 'npc', traits: new Set(['humanoid'])});
    assert.equal(eligibility.eligible, true);
    assert.equal(eligibility.confirmation, predicate.question);
    const state = {status: 'collecting', targets: [{id: 't', excluded: false, eligible: true, degree: 'failure', applicationStatus: 'pending',
        revision: 0, confirmation: {question: predicate.question, status: 'pending'}}]};
    assert.equal(saveCollectionReadiness(state).ready, false);
    correctSaveTarget(state, 't', {action: 'unaffected'}, 'gm');
    assert.deepEqual([state.targets[0].confirmation.status, state.targets[0].eligible], ['immune', false]);
    assert.equal(saveCollectionReadiness(state).ready, true);
    correctSaveTarget(state, 't', {action: 'affected'}, 'gm');
    assert.deepEqual([state.targets[0].confirmation.status, state.targets[0].eligible], ['affected', true]);
});

test('a conjunctive "while" is not an ongoing trigger, but entering an area is', async () => {
    assert.equal(inspectSavePlan(compileAbility(await fixture('rank-3/reblooded.json'))).supported, true);
    // (Pollen Pods' bulbs left the one-time save for the minefield route on 2026-10-03: never an immediate save of the whole area.)
    const pods = compileAbility(await fixture('rank-7/pollen-pods.json'));
    assert.equal(inspectSavePlan(pods).supported, false);
    assert.equal(pods.resolution.lingering?.mines?.count, 4);
    const withdrawn = JSON.parse(await readFile(new URL('../docs/planning/withdrawn-routes.json', import.meta.url), 'utf8')).withdrawn;
    assert.ok(withdrawn.some(entry => entry.name === 'Pollen Pods' && /^Moved, not lost\./.test(entry.reason)));
});

test('only an exact single Interact event executes', () => {
    const base = {kind: 'condition', slug: 'blinded', value: null,
        duration: {mode: 'fixed', value: 1, unit: 'rounds', expiry: 'turn-start', anchor: 'effect-start'},
        endsWhen: [{event: 'action', action: 'interact'}], expirationMode: 'first'};
    assert.equal(isActionEndLifetime(base), true);
    assert.ok(executableConditionLinks([base]));
    for (const broken of [
        {...base, endsWhen: [{event: 'action', action: 'stride'}]},
        {...base, endsWhen: [{event: 'action', action: 'interact'}, {event: 'escape', dc: 'spell'}]},
        {...base, endsWhen: [{event: 'action', action: 'interact', count: 3}]},
        {...base, expirationMode: 'event'}
    ]) assert.equal(executableConditionLinks([broken]), null, JSON.stringify(broken));
});
