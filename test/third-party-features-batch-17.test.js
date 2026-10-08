import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast} from '../src/compiler/plus-feature-rules.js';
import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';
import {summonEligible} from '../src/compiler/summon-families.js';

// Third-party features batch 17 (2026-10-07): spells cast by features — Become Elemental, Create Elemental (residual energy), Constructed Spark; the table's Form of the
// Imperial and Controlled Wrath.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('residual energy spent to cast', () => {
    assert.deepEqual(readActionCast(item('Become Elemental')), {kind: 'become-form', name: 'Become Elemental', spell: {uuid: 'Compendium.pf2e.spells-srd.Item.1K6AYGisvo9gqdhs', name: 'Elemental Form'}, rank: 7, speedBonus: 10, attack: 31, damage: 14, spendsResidual: true});
    assert.deepEqual(readActionCast(item('Create Elemental')).tradition, 'arcane');
});

test('a summon of one trait', () => {
    const data = {traits: ['elemental'], requireTraits: ['fire'], levels: {table: 'summon-trait'}};
    const creature = traits => ({type: 'npc', system: {traits: {value: traits}, details: {level: {value: 1}}}});
    assert.equal(summonEligible(data, creature(['elemental', 'fire']), {castRank: 3}), true);
    assert.equal(summonEligible(data, creature(['elemental', 'water']), {castRank: 3}), false);
});

test('Constructed Spark and the table\'s', () => {
    assert.deepEqual(readSpellshapeFeat(item('Constructed Spark')).riders[0].rank, 'highest');
    for (const name of ['Form of the Imperial', 'Controlled Wrath']) assert.equal(readSpellshapeFeat(item(name))?.riders?.[0]?.type, 'table', name);
});
