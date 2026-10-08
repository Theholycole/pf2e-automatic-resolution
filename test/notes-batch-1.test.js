import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {statedRulesAt} from '../src/compiler/stated-effect.js';

// Notes batch 1 (the notes audit, 2026-10-05): note-only spells whose stated bonuses, Speeds and senses become Effects (`stated-effect`).
const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const stated = async path => { const plan = compileAbility(await fixture(path)); assert.equal(plan.resolution.kind, 'stated-effect', path); return plan.resolution.statedEffect; };

test('bonuses: Movanic Glimmer, Chameleon Coat, Penumbral Disguise, Uncover Device, Part the Mists', async () => {
    const glimmer = await stated('rank-4/movanic-glimmer.json');
    assert.equal(glimmer.recipient, 'targets');
    assert.equal(glimmer.requiresTrait, 'animal');
    assert.equal(glimmer.seconds, 86400);
    assert.deepEqual(glimmer.rules[0], {key: 'FlatModifier', selector: ['perception', 'will'], type: 'status', value: 2});
    assert.deepEqual(glimmer.rules[1].predicate, ['action:command-an-animal']);
    const coat = await stated('rank-5/chameleon-coat.json');
    assert.equal(statedRulesAt(coat, 5)[0].value, 3);
    assert.equal(statedRulesAt(coat, 8)[0].value, 4);
    assert.equal(statedRulesAt(coat, 8).length, 1);
    const shadow = await stated('rank-2/penumbral-disguise.json');
    assert.deepEqual([2, 4, 6, 8].map(rank => statedRulesAt(shadow, rank)[0].value), [1, 2, 3, 4]);
    assert.equal(shadow.toggle.option, 'stated-dim-light');
    const device = await stated('rank-2/uncover-device.json');
    assert.deepEqual(device.rules, [{key: 'FlatModifier', selector: 'thievery', type: 'status', value: 2, predicate: ['action:disable-a-device']}]);
    const mists = await stated('rank-8/part-the-mists-to-paradise.json');
    assert.equal(mists.recipient, 'self-and-targets');
    assert.deepEqual(mists.rules, [{key: 'FlatModifier', selector: 'saving-throw', type: 'status', value: 4}]);
});

test('toggled bonuses: Discern Lies, Threefold Aspect, Chosen Gravity', async () => {
    const lies = await stated('rank-4/discern-lies.json');
    assert.deepEqual(lies.rules[0].predicate, [lies.toggle.option]);
    const age = await stated('rank-3/threefold-aspect.json');
    assert.equal(age.rules[0].selector, 'deception');
    assert.equal(age.rules[0].value, 4);
    const gravity = await stated('rank-3/chosen-gravity.json');
    assert.deepEqual(gravity.rules.map(rule => rule.selector), ['saving-throw', 'fortitude-dc']);
    assert.deepEqual(gravity.secondsByRank, [{rank: 6, seconds: 3600}]);
});

test('senses and Speeds: Stonesense, Elemental Sense, Enhance Senses, Tiny Wings, Feet to Fins', async () => {
    assert.deepEqual((await stated('rank-4/stonesense.json')).rules, [{key: 'Sense', selector: 'tremorsense', acuity: 'imprecise', range: 100}]);
    const elemental = await stated('rank-4/elemental-sense.json');
    assert.deepEqual(elemental.choice.options.find(option => option.key === 'tremorsense').rules, [{key: 'Sense', selector: 'tremorsense', acuity: 'imprecise', range: 30}]);
    assert.deepEqual(elemental.choice.options.find(option => option.key === 'mechanoreception').rules, [{key: 'Sense', selector: 'see-invisibility'}]);
    assert.equal(elemental.choice.options.length, 6);
    const enhance = await stated('rank-4/enhance-senses.json');
    assert.deepEqual(enhance.alternatives[0], {if: {sense: 'low-light-vision'}, rules: [{key: 'Sense', selector: 'darkvision'}]});
    const wings = await stated('rank-3/tiny-wings.json');
    assert.equal(wings.recipient, 'familiar');
    assert.deepEqual(wings.rules, [{key: 'BaseSpeed', selector: 'fly', value: 20}]);
    assert.equal(wings.alternatives[0].rules[0].value, 15);
    const fins = await stated('rank-3/feet-to-fins.json');
    assert.deepEqual(fins.rules.map(rule => rule.value), ['{landSpeed}', 5]);
    // (Personal Ocean stays on its note route: its fire counteract.)
    assert.equal(compileAbility(await fixture('rank-6/personal-ocean.json')).resolution.kind, 'spell-note');
    assert.equal((await stated('rank-4/stonesense.json')).sustained, true);
});
