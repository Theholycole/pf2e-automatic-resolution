import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {attachActionEnds} from '../src/compiler/action-end-lifetime.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('Briny Bolt: row dice as full/double damage, Interact ends Blinded, narration after a duration', async () => {
    const plan = compileAbility(await fixture('rank-1/briny-bolt.json'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.multiplier, 2);
    assert.equal(plan.resolution.outcomes.success.damage.multiplier, 1);
    const crit = Object.fromEntries(plan.resolution.outcomes.criticalSuccess.effects.map(effect => [effect.slug, effect]));
    assert.deepEqual(crit.blinded.endsWhen, [{event: 'action', action: 'interact'}]);
    assert.equal(crit.dazzled.endsWhen ?? null, null);
    assert.deepEqual([crit.dazzled.duration.value, crit.dazzled.duration.unit], [1, 'minutes']);
    // Row dice that are neither the entry nor twice it stay as written (and block the plan).
    const source = await fixture('rank-1/briny-bolt.json');
    source.system.description.value = source.system.description.value.replace('takes 4d6 bludgeoning', 'takes 5d6 bludgeoning');
    assert.notEqual(compileAbility(source).resolution.outcomes?.criticalSuccess?.damage?.multiplier, 2);
});

test('Ray of Frost: the critical row compiles its Speed penalty; the convenience link is recorded', async () => {
    const plan = compileAbility(await fixture('cantrip/ray-of-frost.json'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.outcomes.criticalSuccess.modifiers[0].selector, 'all-speeds');
    assert.equal(plan.compilerEvidence.rowEffectLinks.length, 1);
});

test('Interact endings: "… and end the X condition, but not the Y condition" needs Y in the outcome', () => {
    const outcome = effects => ({rawText: 'The creature can spend an Interact action to rub its eyes and end the blinded condition, but not the dazzled condition.',
        effects: effects.map(slug => ({slug, duration: {mode: 'fixed', value: 1, unit: 'rounds'}}))});
    const both = outcome(['blinded', 'dazzled']); attachActionEnds(both);
    assert.deepEqual(both.effects[0].endsWhen, [{event: 'action', action: 'interact'}]);
    const missing = outcome(['blinded']); attachActionEnds(missing);
    assert.equal(missing.effects[0].endsWhen, undefined);
});
