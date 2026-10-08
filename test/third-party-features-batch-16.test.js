import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readCastReaction} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 16 (2026-10-07): reactions to a casting — Archmage's Counter, Seal the Wicket, Haughty Correction, Residual Energy Capture.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const read = name => readCastReaction(structuredClone(items.find(entry => entry.name === name)));

test('the reactions', () => {
    assert.deepEqual(read("Archmage's Counter"), {kind: 'counter', name: "Archmage's Counter", enemies: true, noSlot: true, rank: 'half-level', modifier: 'attribute+proficiency', mythic: true});
    assert.deepEqual(read('Seal the Wicket'), {kind: 'counter', name: 'Seal the Wicket', enemies: false, wicketTrait: true});
    const haughty = read('Haughty Correction');
    assert.deepEqual([haughty.within, haughty.skill, haughty.condition.slug, haughty.condition.value, haughty.criticalRounds, haughty.immunityMinutes], [30, 'arcana', 'stupefied', 1, 10, 1]);
    assert.deepEqual(read('Residual Energy Capture').traits, ['acid', 'air', 'cold', 'earth', 'electricity', 'fire', 'metal', 'water', 'wood']);
});
