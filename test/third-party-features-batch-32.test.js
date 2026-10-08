import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape} from '../src/compiler/item-spellshape.js';
import {readBackfireAmmo} from '../scripts/plus-ammo-runtime.js';

// Third-party features batch 32 (2026-10-07): Blue Salt Crystal (a catalyst for Drown) and Gray Dust Ammunition (the backfire on the next spell). The hit, the cast and the cards are live.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Blue Salt Crystal: Drown only, persistent acid equal to the rank for an affected target', () => {
    const [activation] = readItemSpellshape(item('Blue Salt Crystal')).activations;
    assert.deepEqual([activation.requires, activation.riders], [{spells: ['Drown']}, [{type: 'spell-persistent', formula: 'rank', damageType: 'acid', when: 'affected'}]]);
});

test('Gray Dust Ammunition: 8d4 force (lesser), basic Fortitude, Stupefied 2 on a critical failure', () => {
    const lesser = readBackfireAmmo(item('Gray Dust Ammunition (Lesser)'));
    assert.deepEqual([lesser.rounds, lesser.damage, lesser.statistic, lesser.dc, lesser.criticalFailure.slug, lesser.criticalFailure.value, lesser.criticalFailure.rounds],
        [10, {formula: '8d4', type: 'force'}, 'fortitude', 25, 'stupefied', 2, 1]);
    assert.ok(readBackfireAmmo(item('Gray Dust Ammunition (Greater)')));
});
