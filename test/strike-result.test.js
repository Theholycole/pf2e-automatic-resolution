import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {findStrikeMessage} from '../scripts/strike-prelude-runtime.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));

test('Strike result: Flowing Strike compiles to a Strike check', async () => {
    const plan = compileAbility(await fixture('rank-5/flowing-strike.json'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'strike');
    assert.equal(plan.resolution.strikePrelude.result, true);
    for (const degree of ['criticalSuccess', 'success']) {
        assert.equal(plan.resolution.outcomes[degree].damage.multiplier, 1); // the wave's damage, not the Strike's
        assert.deepEqual(plan.resolution.outcomes[degree].forcedMovement, {kind: 'push', distance: 10, upTo: false, optional: false, direction: 'any'});
    }
    assert.equal(plan.resolution.outcomes.failure.damage.mode, 'none');
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['strike-prelude', 'strike-prelude', 'strike-prelude']);
});

test('Strike result: refused shapes', async () => {
    const source = await fixture('rank-5/flowing-strike.json');
    const wrong = structuredClone(source); wrong.system.damage['0'].formula = '3d10';
    assert.equal(inspectSavePlan(compileAbility(wrong)).supported, false);
    const extra = structuredClone(source);
    extra.system.description.value = extra.system.description.value.replace('direction of your choice.', 'direction of your choice. The target is also Slowed 1.');
    assert.equal(inspectSavePlan(compileAbility(extra)).supported, false);
    // A Strike check without the Strike spell's proof is refused.
    const plan = compileAbility(source); delete plan.resolution.strikePrelude;
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Strike result: the latest matching PF2e Strike message', () => {
    const message = (id, {timestamp, actor = 'Actor.c', target = 'Actor.t', domains = ['strike-attack-roll'], type = 'attack-roll', outcome = 'success'}) =>
        ({id, timestamp, actor: {uuid: actor}, flags: {pf2e: {context: {type, domains, outcome, target: {actor: target}}}}});
    const messages = [
        message('old', {timestamp: 5}),
        message('spell', {timestamp: 20, domains: ['spell-attack-roll']}),
        message('other-target', {timestamp: 21, target: 'Actor.x'}),
        message('other-caster', {timestamp: 22, actor: 'Actor.z'}),
        message('first', {timestamp: 12, outcome: 'failure'}),
        message('reroll', {timestamp: 15, outcome: 'criticalSuccess'})
    ];
    assert.equal(findStrikeMessage({casterUuid: 'Actor.c', targetActorUuid: 'Actor.t', after: 10}, messages).id, 'reroll');
    assert.equal(findStrikeMessage({casterUuid: 'Actor.c', targetActorUuid: 'Actor.t', after: 30}, messages), null);
});
