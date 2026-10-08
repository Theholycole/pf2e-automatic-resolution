import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast, readSpellstrikeFeature} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 26 (2026-10-07): Don Visage, Slidecasting, Invigorate.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = (name, type) => structuredClone(items.find(entry => entry.name === name && (!type || entry.type === type)));

test('Don Visage: an Arcana check against the level DC, 3 rounds or 4', () => {
    const read = readActionCast(item('Arcane Cascade: Don Visage', 'action'));
    assert.deepEqual([read.kind, read.skill, read.rounds], ['don-visage', 'arcana', {success: 3, criticalSuccess: 4}]);
});

test('Slidecasting and Invigorate', () => {
    const slide = readSpellstrikeFeature(item('Slidecasting', 'feat'));
    assert.deepEqual([slide.kind, slide.bonus, slide.bonusType, slide.rounds, slide.effect.name], ['slidecast', 1, 'status', [2, 3, 4], 'Effect: Arcane Cascade: Slidecast']);
    const invigorate = readSpellstrikeFeature(item('Arcane Cascade: Invigorate', 'action'));
    assert.deepEqual([invigorate.kind, invigorate.toFamiliar, invigorate.effect.name], ['kill-reaction', true, 'Effect: Arcane Cascade: Invigorate']);
});
