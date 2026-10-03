import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {parseDegreeRider} from '../src/compiler/basic-degree-rider.js';
import {assessSimpleBasicSaveDescription} from '../src/compiler/semantic-gate.js';
import {analyzeDescription} from '../src/compiler/description-parser.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const LINK = (id, label) => `@UUID[Compendium.pf2e.conditionitems.Item.${id}]{${label}}`;
const FAIL = ['failure', 'criticalFailure'], CRIT = ['criticalFailure'];

function detached(original, description = original.system.description.value, name = 'Custom Rider Spell') {
    const item = structuredClone(original);
    item._id = 'custom-rider-spell1';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = name;
    item.system.slug = name.toLowerCase().replaceAll(' ', '-');
    item.system.description.value = description;
    return item;
}

test('degree phrases map "fails" to failure and critical failure, "critically fails" to critical failure', () => {
    for (const [sentence, degrees, alternative] of [
        [`A creature that fails its saving throw also becomes ${LINK('a', 'Sickened 1')}.`, FAIL, false],
        [`If it critically fails, the target is also ${LINK('b', 'Fatigued')} until the start of your next turn.`, CRIT, false],
        [`On a failed saving throw, a creature becomes ${LINK('c', 'Dazzled')} for 1 round, or dazzled for 4 rounds on a critical failure.`, FAIL, true],
        [`On a failure, a creature is also ${LINK('d', 'Sickened 1')}, or ${LINK('d', 'Sickened 2')} on a critical failure.`, FAIL, true],
        ['A creature that fails its save also falls prone.', FAIL, false],
        [`Additionally, creatures that critically fail the save are knocked ${LINK('e', 'Prone')}.`, CRIT, false],
        [`On a critical failure, the creature is also ${LINK('f', 'Stunned')} for 1 round as it reels from the impact of so much anguish.`, CRIT, false]
    ]) {
        const rider = parseDegreeRider(sentence);
        assert.deepEqual(rider?.degrees, degrees, sentence);
        assert.equal(!!rider.alternative, alternative, sentence);
    }
});

test('any unaccounted rider text rejects the sentence', () => {
    for (const sentence of [
        `A creature that fails its save also becomes ${LINK('a', 'Clumsy 1')} from numbness if it's in the area of stolen heat.`,
        `On a critical failure, the creature is also ${LINK('b', 'Stunned')} for 1 round as it is pushed 10 feet back.`,
        `On a critical failure, the creature is also ${LINK('b', 'Stunned')} for 1 round as it falls prone.`,
        `On a failure, the target is also ${LINK('c', 'Dazzled')} for 1 round and is pushed 5 feet.`,
        `On a critical failure, a creature becomes ${LINK('d', 'Dazzled')}, or dazzled for 4 rounds on a failure.`,
        `A creature that fails its save and was standing also falls prone.`
    ]) assert.equal(parseDegreeRider(sentence), null, sentence);
});

test('Torturous Trauma composes its rider with a GM-confirmed organ question', async () => {
    const plan = compileAbility(await fixture('cantrip/torturous-trauma.json'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.outcomes.failure.effects, []);
    const [fatigued] = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual([fatigued.slug, fatigued.duration.value, fatigued.duration.anchor, fatigued.duration.expiry], ['fatigued', 1, 'source-turn', 'turn-start']);
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'gm-confirmed'));
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'living-creature'));
});

test('Vomit Swarm applies Sickened 1 to failing creatures; its lifecycle sentence is flavor for an instantaneous spell', async () => {
    const plan = compileAbility(await fixture('rank-2/vomit-swarm.json'));
    assert.equal(inspectSavePlan(plan).supported, true);
    for (const degree of FAIL) assert.deepEqual(plan.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.value]), [['sickened', 1]], degree);
    assert.equal(plan.lifecycle.durationSpec.mode, 'instantaneous');
    const copy = compileAbility(detached(await fixture('rank-2/vomit-swarm.json')));
    assert.equal(inspectSavePlan(copy).supported, true);
});

test('the simple gate rejects caster movement, eligibility and plain condition grants in the remainder', () => {
    const adapted = {defense: {kind: 'save', basic: true, statistic: 'reflex'}, damageComponents: [{id: '0'}], lifecycle: {sustained: false}, rules: []};
    for (const text of [
        'You jump up to 120 feet and then deal 6d6 fire damage with a basic Reflex save.',
        'Creatures that lack blood are unaffected. You deal 6d6 fire damage with a basic Reflex save.',
        'Victims become slowed 1. You deal 6d6 fire damage with a basic Reflex save.'
    ]) assert.equal(assessSimpleBasicSaveDescription({...adapted, descriptionHTML: text}, analyzeDescription(text)).complete, false, text);
});

test('timed Stunned executes as a duration, never as action debt', async () => {
    const {isTimedStunned, executableConditionLinks} = await import('../scripts/basic-save-core.js');
    for (const path of ['rank-5/synaptic-pulse.json', 'rank-6/pain-of-ages.json', 'rank-1/dizzying-colors.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        const timed = plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'stunned');
        assert.equal(isTimedStunned(timed), true, path);
    }
    const timed = {kind: 'condition', slug: 'stunned', value: null, duration: {mode: 'fixed', value: 1, unit: 'rounds', expiry: 'turn-start'}};
    assert.ok(executableConditionLinks([timed]));
    assert.equal(executableConditionLinks([{...timed, duration: null}]), null, 'unvalued Stunned needs a timer');
    assert.equal(executableConditionLinks([{...timed, duration: {mode: 'fixed', value: 1, unit: 'days'}}]), null);
});
