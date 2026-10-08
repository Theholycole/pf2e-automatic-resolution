import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 1 (2026-10-07): the "+" spellshapes that fit the spellshape riders — Persistent Spell, Bleeding Spell, Trepidation Spell, Heightened Spell,
// Dueling Wand, Draining Cast, Befuddling Spell (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));

test('the "+" spellshapes read into riders', () => {
    assert.deepEqual(shape('Persistent Spell').riders, [{type: 'persistent', when: 'hit-or-failed', formula: '2*rank', damageType: 'spell', critDouble: true}]);
    assert.deepEqual(shape('Persistent Spell').requires, {singleTarget: true, damaging: true});
    assert.deepEqual(shape('Bleeding Spell').riders, [{type: 'persistent', when: 'hit-or-failed', formula: 'rank', damageType: 'bleed', oneTarget: true}]);
    const trepidation = shape('Trepidation Spell');
    assert.deepEqual([trepidation.requires, trepidation.riders[0].unlessImmune, trepidation.riders[0].degrees.criticalFailure[0].value], [{belowHighest: 2, saves: ['will']}, ['emotion', 'fear', 'mental'], 2]);
    assert.deepEqual(shape('Heightened Spell').riders[0], {type: 'rank-change', by: 2});
    assert.deepEqual(shape('Dueling Wand').riders[0].rules[0].value, {byLevel: [[1, 1], [10, 2], [18, 3]]});
    assert.deepEqual(shape('Draining Cast').riders, [{type: 'slot-refund'}, {type: 'hp-cost', formula: '2*rank'}]);
    assert.match(shape('Befuddling Spell').riders[0].text, /–4 circumstance penalty to Identify the Magic/);
});

test('"at least 2 ranks below your maximum rank"', () => {
    const requires = shape('Trepidation Spell').requires;
    assert.equal(unmetRequirement(requires, {rank: 3, highest: 5, saveStatistic: 'will', traits: [], damageTypes: []}), null);
    assert.match(unmetRequirement(requires, {rank: 4, highest: 5, saveStatistic: 'will', traits: [], damageTypes: []}), /2 ranks below/);
});
