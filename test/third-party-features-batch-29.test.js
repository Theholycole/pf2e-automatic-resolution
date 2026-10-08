import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readEssenceActivation} from '../scripts/essence-runtime.js';

// Third-party features batch 29 (2026-10-07): essence casting E3a — the Incantations action and the essence items' activations, read from their texts.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const all = name => items.filter(entry => entry.name === name);

test('the incantation and the essence items', () => {
    assert.deepEqual(readEssenceActivation(all('Incantations')[0]), {name: 'Incantations', kind: 'incantation', inEncounter: false});
    assert.deepEqual(readEssenceActivation(all('Magic Bell (3rd-Rank Essence Spell)')[0]), {name: 'Magic Bell (3rd-Rank Essence Spell)', kind: 'bell', maxRank: 3, noReduce: true, inEncounter: true, perDay: true});
    assert.equal(readEssenceActivation(all('Magic Amulet (2nd-Rank Essence Spell)')[0]).kind, 'amulet');
    assert.equal(readEssenceActivation(all('Magic Chalice (1st-Rank Essence Spell)')[0]).kind, 'chalice');
    // (The tome's own text has no activation; Magic+'s second 1st-rank tome carries the bell's text, read as a bell.)
    assert.deepEqual(all('Magic Tome (1st-Rank Essence Spell)').map(item => readEssenceActivation(item)?.kind ?? null).sort(), ['bell', null].sort());
    for (let rank = 1; rank <= 9; rank++) assert.equal(readEssenceActivation(items.find(entry => entry.name === `Magic Bell (${rank}${['st', 'nd', 'rd'][rank - 1] ?? 'th'}-Rank Essence Spell)`))?.maxRank, rank);
});
