import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 6 (2026-10-07): Seeking Spell; the table's — Tandem Casting, Spell Tag, Distilled Magic, Mixed-Potency Tincture, Recharging Spellgun,
// Elemental Study Notes (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('Seeking Spell: cover reduced, the retry a reminder', () => {
    const seeking = shape('Seeking Spell');
    assert.deepEqual(seeking.requires, {attack: true});
    assert.deepEqual(seeking.riders[0], {type: 'cover-reduce', by: 2});
    assert.deepEqual(seeking.riders[1].rounds, {base: 1, from: 14, every: 2});
});

test('the table\'s', () => {
    for (const name of ['Tandem Casting', 'Spell Tag', 'Distilled Magic', 'Mixed-Potency Tincture', 'Recharging Spellgun', 'Elemental Study Notes'])
        assert.deepEqual(shape(name).riders.map(rider => rider.type), ['table'], name);
    for (const name of ['Distilled Magic', 'Mixed-Potency Tincture', 'Recharging Spellgun', 'Elemental Study Notes']) assert.equal(shape(name).passive, true, name);
    assert.deepEqual(shape('Recharging Spellgun').requires, {table: ['You are wielding your makeshift spellgun']});
    const tag = shape('Spell Tag');
    assert.match(unmetRequirement(tag.requires, facts({range: '30 feet'})), /isn't touch/);
    assert.equal(unmetRequirement(tag.requires, facts({range: 'touch'})), null);
    assert.match(unmetRequirement(shape('Tandem Casting').requires, facts({actions: 3})), /doesn't take 1 or 2 actions/);
});
