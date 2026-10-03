import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {messageAtRank, wordCount} from '../src/compiler/message-compiler.js';
import {isExecutableMessagePlan} from '../scripts/message-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));

test('Message: 120 feet (500 from rank 3), a brief reply in its window and range', async () => {
    const plan = compileAbility(await spell('cantrip/message'));
    assert.equal(isExecutableMessagePlan(plan), true, JSON.stringify(plan.automation));
    const {message} = plan.resolution;
    assert.deepEqual([message.range, message.words, message.delivery], [120, null, 'immediate']);
    assert.deepEqual(message.reply, {words: null, brief: true, window: 'reaction-or-next-turn', withinRange: true});
    assert.equal(messageAtRank(message, 2).range, 120);
    assert.equal(messageAtRank(message, 3).range, 500);
});

test('Sending: 25 words each way, any distance', async () => {
    const plan = compileAbility(await spell('rank-5/sending'));
    assert.equal(isExecutableMessagePlan(plan), true);
    assert.deepEqual([plan.resolution.message.words, plan.resolution.message.reply.words, plan.resolution.message.range], [25, 25, null]);
    assert.equal(plan.targeting.actorConstraints.complete, true);
});

test('Dream Message: one-way, delivered when the target sleeps; 10 targets from rank 4', async () => {
    const plan = compileAbility(await spell('rank-3/dream-message'));
    assert.equal(isExecutableMessagePlan(plan), true);
    const {message} = plan.resolution;
    assert.deepEqual([message.delivery, message.reply, message.words, message.wordsApproximate], ['when-asleep', null, 150, true]);
    assert.equal(messageAtRank(message, 3).maxTargets, 1);
    assert.equal(messageAtRank(message, 4).maxTargets, 10);
});

test('messaging refuses text it does not account for', async () => {
    const sending = await spell('rank-5/sending');
    sending.system.description.value = sending.system.description.value.replace('</p>', ' The target is also Stunned 1.</p>');
    assert.equal(isExecutableMessagePlan(compileAbility(sending)), false);
    const message = await spell('cantrip/message');
    message.system.description.value = message.system.description.value.replace('range increases to 500 feet.', 'range increases to 500 feet, and the target gains a +1 status bonus to Perception.');
    assert.equal(isExecutableMessagePlan(compileAbility(message)), false);
    // Other communication spells aren't messages.
    assert.notEqual(compileAbility(await spell('rank-4/telepathy')).resolution.kind, 'message');
    assert.equal(wordCount('  one two\nthree  '), 3);
});
