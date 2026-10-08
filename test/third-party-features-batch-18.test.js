import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readTextRules, readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';
import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 18 (2026-10-07): the Wildblood instinct's rage damage on spells, its Wildblood Infusion after each cast, and Explosive Blood.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('rage damage on spells while raging: the module\'s rules', () => {
    assert.deepEqual(readTextRules(item('Wildblood Instinct')), {name: 'Wildblood Instinct', verified: true});
});

test('the Wildblood Infusion after each cast', () => {
    const read = readPassiveCastRider(item('Wildblood Instinct'));
    assert.deepEqual(read.riders, [{type: 'self-effect', uuid: 'Compendium.pf2e-team-plus-barbarians.misc.Item.SBYWCgB16XQVuPau', name: 'Effect: Wildblood Infusion', choiceFromDamage: true, replace: true}]);
});

test('Explosive Blood: raging and a damaging spell', () => {
    const read = readSpellshapeFeat(item('Explosive Blood'));
    assert.deepEqual(read.riders[0].rules.map(rule => [rule.selector, rule.slug, rule.value]), [['spell-damage', 'wildblood-rage', 2], ['strike-damage', 'rage', 2]]);
    assert.equal(read.riders[0].until, 'caster-next-turn-end');
    assert.equal(unmetRequirement(read.requires, {raging: false, damageTypes: ['fire'], traits: []}), "you aren't raging");
});
