import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 20 (2026-10-07): Colossal Summon and Colossal Aspect Form.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Colossal Summon: a 10th-rank summon gains the listed abilities', () => {
    const read = readSpellshapeFeat(item('Colossal Summon'));
    const [rider] = read.riders;
    assert.deepEqual(read.requires, {rank: 10, anyTraits: ['summon']});
    assert.deepEqual([rider.type, rider.squares, rider.speedBonus, rider.earthShatterer.actions, rider.earthShatterer.spell.name, rider.earthShatterer.perSeconds], ['colossal', 6, 20, 2, 'Earthquake', 60]);
    const mega = rider.megalophobia;
    assert.deepEqual([mega.radius, mega.traits, mega.statistic, mega.immunitySeconds], [100, ['emotion', 'fear', 'mental'], 'will', 3600]);
    assert.deepEqual(mega.failure.map(entry => [entry.slug, entry.value]), [['frightened', 2]]);
    assert.deepEqual(mega.criticalFailure.map(entry => [entry.slug, entry.value ?? entry.whileCondition]), [['frightened', 3], ['fleeing', 'frightened']]);
    assert.equal(unmetRequirement(read.requires, {rank: 9, traits: ['summon'], damageTypes: []}), "it isn't cast at rank 10");
});

test('Colossal Aspect Form: an aspect battle form at 10th', () => {
    const read = readSpellshapeFeat(item('Colossal Aspect Form'));
    assert.deepEqual(read.requires, {rank: 10, anyTraits: ['aspectmorph']});
    assert.deepEqual(read.riders, [{type: 'form-choice', selections: {shift: {reach: 20, size: 'grg', sizeNum: 6}}},
        {type: 'colossal-form', squares: 6, reach: 25, trample: 'Compendium.pf2e-team-plus-magic.misc.Item.XVveTQK3RY2w72XL'}]);
});
