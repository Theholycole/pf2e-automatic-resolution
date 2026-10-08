import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape} from '../src/compiler/item-spellshape.js';

// Third-party features batch 8 (2026-10-07): the Power Ring runes' spellshapes — Precision's Hone Spell, Calling's Veracious Summon.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => readItemSpellshape(structuredClone(items.find(entry => entry.name === name && entry.type !== 'spell')));

test('Hone Spell and Veracious Summon', () => {
    const hone = item('Precision').activations[0];
    assert.deepEqual(hone.requires, {area: true, saves: ['reflex', 'fortitude']});
    assert.deepEqual(hone.riders[0], {type: 'hone', degrees: {criticalSuccess: 'criticalFailure', success: 'failure', failure: 'criticalSuccess', criticalFailure: 'criticalSuccess'}, ringBonus: true});
    const summon = item('Calling').activations[0];
    assert.deepEqual(summon.riders[0], {type: 'summon-strike-bonus', ringBonus: true});
    assert.deepEqual(summon.requires.anyTraits, ['summon']);
});
