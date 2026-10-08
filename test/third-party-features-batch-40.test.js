import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast} from '../src/compiler/plus-feature-rules.js';
import {readCastAfter} from '../scripts/plus-cast-riders-runtime.js';

// Third-party features batch 40 (2026-10-07): Consume Item Magic, Vital Pululation, Ancient and Bizarre Surge (the slots, the Heal and the Effects are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const feat = name => structuredClone(items.find(entry => entry.name === name && entry.type === 'feat'));

test('Consume Item Magic, Vital Pululation, the surges', () => {
    assert.equal(readActionCast(feat('Consume Item Magic')).kind, 'consume-item-slot');
    const vital = readActionCast(feat('Vital Pululation'));
    assert.deepEqual([vital.kind, vital.minCursebound, vital.actions, vital.spell.name], ['free-heal', 2, '3', 'Heal']);
    assert.deepEqual(readCastAfter(feat('Ancient Surge')).effect.name, 'Spell Effect: Ancient Surge');
    assert.deepEqual(readCastAfter(feat('Bizarre Surge')).effect.name, 'Spell Effect: Bizarre Surge');
});
