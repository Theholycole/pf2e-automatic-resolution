import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast} from '../src/compiler/plus-feature-rules.js';
import {readPlusSpellshape} from '../src/compiler/plus-spellshapes.js';

// Third-party features batch 34 (2026-10-07): Spell Ignition (the ambient magic's area and rounds) and Cone of Figments (the cone on a hit). The region, the turn's end and the cone are live.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Spell Ignition: basic Fortitude, 2, 3 or 4 rounds', () => {
    assert.deepEqual(readActionCast(item('Arcane Cascade: Spell Ignition')), {kind: 'spell-ignition', name: 'Arcane Cascade: Spell Ignition', statistic: 'fortitude', rounds: {base: 2, specialization: 3, greater: 4}});
});

test('Cone of Figments: not a cantrip or focus spell; a 10-foot cone of 1d4 per rank, basic Reflex', () => {
    const read = readPlusSpellshape(item('Cone of Figments'));
    assert.deepEqual(read.requires.notTraits, ['cantrip', 'focus']);
    const [cone] = read.riders[0].hit;
    assert.deepEqual([cone.type, cone.feet, cone.dice, cone.faces, cone.statistic], ['cone-burst', 10, 1, 4, 'reflex']);
});
