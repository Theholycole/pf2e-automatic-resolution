import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isRecurringSaveLifetime, targetOutcomeConditions} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));

test('Jealous Hex: the condition by the highest attribute, the row value, and a save at the start of the caster\'s turns', async () => {
    const plan = compileAbility(await spell('rank-1/jealous-hex'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.attributeCondition.options, [
        {slug: 'enfeebled', attributes: ['str']}, {slug: 'clumsy', attributes: ['dex']}, {slug: 'drained', attributes: ['con']}, {slug: 'stupefied', attributes: ['int', 'wis', 'cha']}]);
    const failure = plan.resolution.outcomes.failure.effects;
    assert.ok(failure.every(effect => effect.value === 1 && effect.duration.value === 1 && effect.duration.unit === 'minutes' && isRecurringSaveLifetime(effect)));
    assert.equal(failure[0].recurringSave.timing, 'caster-turn-start');
    assert.ok(plan.resolution.outcomes.criticalFailure.effects.every(effect => effect.value === 2));
    const state = {outcomes: plan.resolution.outcomes};
    assert.deepEqual(targetOutcomeConditions(state, {degree: 'failure', attributeCondition: {status: 'set', slug: 'drained'}}).map(effect => effect.slug), ['drained']);
    assert.deepEqual(targetOutcomeConditions(state, {degree: 'failure', attributeCondition: {status: 'pending', options: ['clumsy', 'drained']}}), []);
    // A map missing an attribute isn't read.
    const partial = await spell('rank-1/jealous-hex');
    partial.system.description.value = partial.system.description.value.replace('; or Intelligence, Wisdom, or Charisma (@UUID[Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg]{Stupefied})', '');
    assert.equal(compileAbility(partial).resolution.attributeCondition, undefined);
});
