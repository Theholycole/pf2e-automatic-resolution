import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {strikeRiderSource, reminderHTML} from '../scripts/strike-prelude-runtime.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;

test('Strike prelude: Booming Blast (enemies in the emanation, Frightened)', async () => {
    const plan = compileAbility(await fixture('rank-1/booming-blast.json'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'will');
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'enemy-of-caster'}]);
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].value, 2);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['strike-prelude']);
    assert.equal(plan.resolution.strikePrelude.reach, 'ranged');
});

test('Strike prelude: Thunderous Strike and Pulverizing Wake', async () => {
    const thunder = compileAbility(await fixture('rank-1/thunderous-strike.json'));
    assert.equal(supported(thunder), true, JSON.stringify(inspectSavePlan(thunder).blockers));
    assert.equal(thunder.resolution.outcomes.criticalFailure.effects[0].slug, 'prone');
    assert.deepEqual(thunder.resolution.reminders.map(reminder => reminder.kind), ['strike-prelude', 'strike-placement']);
    const wake = compileAbility(await fixture('rank-5/pulverizing-wake.json'));
    assert.equal(supported(wake), true, JSON.stringify(inspectSavePlan(wake).blockers));
    assert.deepEqual(wake.resolution.strikePrelude.extraOnHit, {formula: '3d8', damageType: 'sonic'});
    assert.equal(wake.targeting.actorConstraints.complete, true);
});

test('Strike prelude: rules that change the Strike or depend on its result stay blocked', async () => {
    for (const path of ['rank-1/force-fling.json', 'rank-1/spinning-staff.json', 'rank-6/tentacular-innervation.json', 'rank-3/warding-aggression.json']) {
        const source = await fixture(path).catch(() => null);
        if (!source) continue;
        assert.equal(supported(compileAbility(source)), false, path);
    }
    // A forged reminder kind on a plan without a Strike prelude is refused.
    const plan = compileAbility(await fixture('rank-1/thunderous-strike.json'));
    delete plan.resolution.strikePrelude;
    assert.equal(supported(plan), false);
    // An extra rule after the Strike is refused.
    const source = await fixture('rank-1/booming-blast.json');
    source.system.description.value = source.system.description.value.replace('on a critical failure).', 'on a critical failure). You gain a +1 status bonus to AC.');
    assert.equal(supported(compileAbility(source)), false);
});

test('Strike rider Effect and card reminders', () => {
    const source = strikeRiderSource({spellName: 'Pulverizing Wake', reach: 'melee', formula: '3d8', damageType: 'sonic', castId: 'c1', sourceItemUuid: null});
    assert.deepEqual(source.system.rules, [{key: 'DamageDice', selector: 'melee-strike-damage', diceNumber: 3, dieSize: 'd8', damageType: 'sonic'}]);
    assert.equal(source.system.duration.expiry, 'turn-end');
    assert.equal(strikeRiderSource({spellName: 'X', reach: 'ranged', formula: '1d6', damageType: 'fire', castId: 'c'}).system.rules[0].selector, 'ranged-strike-damage');
    assert.throws(() => strikeRiderSource({spellName: 'X', reach: 'melee', formula: '3d8+2', damageType: 'sonic', castId: 'c'}));
    const escape = value => String(value);
    assert.match(reminderHTML({kind: 'strike-prelude', text: 'Make a melee Strike.'}, escape), /PF2e's own Strike/);
    assert.match(reminderHTML({kind: 'counteract-along-path', text: 'x', target: 'light'}, escape), /counteract/);
});
