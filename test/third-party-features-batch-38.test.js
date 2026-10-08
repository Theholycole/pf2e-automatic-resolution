import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider, readActionCast} from '../src/compiler/plus-feature-rules.js';
import {readPlusSpellshape} from '../src/compiler/plus-spellshapes.js';
import {readCastAfter} from '../scripts/plus-cast-riders-runtime.js';

// Third-party features batch 38 (2026-10-07): Stigmata, Archmemory, Spell Eating, Black Book Hex, Outsider Caller (the slots, bleeds and cards are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Stigmata: its bleed, its Harm rider, its Heal part', () => {
    assert.deepEqual(readActionCast(item('Stigmata')).kind, 'stigmata');
    const [harm] = readPassiveCastRider(item('Stigmata')).riders;
    assert.deepEqual([harm.formula, harm.damageType, harm.degreesByActions, harm.whileCasterBleeding], ['per4levels-d4', 'bleed', {3: ['criticalFailure']}, true]);
    assert.deepEqual(readCastAfter(item('Stigmata')), {kind: 'stigmata-heal', name: 'Stigmata', flatDC: 11});
});

test('Archmemory, Spell Eating, Black Book Hex, Outsider Caller', () => {
    assert.equal(readActionCast(item('Archmemory')).kind, 'regain-last-slot');
    assert.deepEqual([readActionCast(item('Spell Eating')).kind, readActionCast(item('Spell Eating')).faces], ['eat-slot', 12]);
    assert.deepEqual(readPlusSpellshape(item('Black Book Hex')).riders[0], {type: 'self-damage', formula: 'rank', damageType: 'spirit'});
    assert.deepEqual(readCastAfter(item('Outsider Caller')), {kind: 'summon-burst', name: 'Outsider Caller', type: 'spirit', radius: 15, statistic: 'reflex'});
});
