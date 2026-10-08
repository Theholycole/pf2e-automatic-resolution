import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 9 (2026-10-07): Fury of a Thousand — Murmuration's damage in full as both types (the user's reading), its critical failure −3;
// Song of Strength +2 (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell')));

test('Fury of a Thousand: riders by spell', () => {
    const fury = shape('Fury of a Thousand');
    assert.deepEqual(fury.requires, {spells: ['Song of Strength', 'Murmuration']});
    assert.deepEqual(fury.riders, [
        {type: 'dual-damage', spell: 'Murmuration', types: ['piercing', 'sonic']},
        {type: 'effect-value', spell: 'Murmuration', effectName: 'Spell Effect: Murmuration', from: -2, to: -3},
        {type: 'effect-value', spell: 'Song of Strength', effectName: 'Spell Effect: Song of Strength', from: 1, to: 2}]);
});
