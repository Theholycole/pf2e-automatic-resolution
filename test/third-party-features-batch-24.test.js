import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';
import {readSpellstrikeFeature} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 24 (2026-10-07): Whirling Wand Strike, Eat This!, Dealer of Death, Slide Slice and the Spellstrike permissions.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name && entry._pack?.startsWith('magus')));

test('Whirling Wand Strike: a wand spell, Spellstruck if asked, +half the rank to damage', () => {
    const read = readSpellshapeFeat(item('Whirling Wand Strike'));
    assert.deepEqual(read.requires, {actions: [1, 2], fromWand: true});
    assert.deepEqual([read.riders[0].ask, read.riders[0].selfRules[0].value], ['Spellstrike with the wand?', 'halfRank']);
    assert.equal(unmetRequirement(read.requires, {actions: 2, fromWand: false, traits: [], damageTypes: []}), "it isn't cast from a wand");
});

test('Eat This!: the eat-this toggle and its note', () => {
    const read = readSpellshapeFeat(item('Eat This!'));
    assert.deepEqual([read.riders[0].rollOption, read.requires.inArcaneCascade, read.requires.table], ['eat-this', true, ['you have at least one spellshell', 'your Spellstrike is charged']]);
});

test('Dealer of Death, Slide Slice and the permissions', () => {
    const dealer = readSpellstrikeFeature(item('Dealer of Death'));
    assert.deepEqual(dealer.cards.map(card => `${card.roll} ${card.card} ${card.type}`), ['1 Hammers cold', '2 Keys fire', '3 Shields poison', '4 Books electricity', '5 Stars mental', '6 Crowns acid']);
    assert.ok(new RegExp(dealer.weapon, 'i').test('Infused Deck'));
    assert.equal(readSpellstrikeFeature(item('Slide Slice')).kind, 'crit-card');
    for (const name of ['Horizon Spellshell', 'Starlit Span+', 'Flinging Figments']) assert.equal(readSpellstrikeFeature(item(name))?.allows, 'ranged', name);
    assert.equal(readSpellstrikeFeature(item('Second-Hand Wand'))?.allows, 'wand');
});
