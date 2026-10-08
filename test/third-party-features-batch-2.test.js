import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 2 (2026-10-07): Heroic Recovery+, Mighty Summons, Storm Spell, Travel Channel, Ride the Spell, Slot Rehearsed Reload, Tenacious Magic
// (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('Heroic Recovery+: PF2e\'s Effect, its values at 16th level', () => {
    const read = shape('Heroic Recovery+');
    assert.deepEqual(read.requires, {spells: ['Heal'], singleTarget: true, targetTraits: ['living']});
    assert.equal(read.riders[0].uuid, 'Compendium.pf2e.feat-effects.Item.7ogytOgDmh4h2g5d');
    assert.deepEqual(read.riders[0].atLevel, {level: 16, rules: [{key: 'FlatModifier', selector: 'land-speed', type: 'status', value: 10},
        {key: 'FlatModifier', selector: 'attack', type: 'status', value: 2}, {key: 'FlatModifier', selector: 'damage', type: 'status', value: 1}]});
    assert.equal(read.riders[1].type, 'table');
});

test('Mighty Summons: a rank higher, up to 10th; the Special a note', () => {
    const read = shape('Mighty Summons');
    assert.deepEqual(read.riders[0], {type: 'rank-change', by: 1, cap: 10});
    assert.deepEqual([read.requires.anyTraits, read.requires.fromSlots], [['summon'], true]);
    assert.match(read.riders[2].text, /two levels higher/);
    assert.match(unmetRequirement(read.requires, facts({traits: ['concentrate']})), /none of the summon/);
});

test('Storm Spell: the area as terrain, its Requirements read', () => {
    const read = shape('Storm Spell');
    assert.deepEqual(read.riders, [{type: 'terrain', where: 'area', difficult: true, hazard: {formula: 'rank', damageTypes: ['electricity', 'bludgeoning'], per: 'square'}, rounds: 'cursebound'}]);
    assert.deepEqual(read.requires, {anyTraits: ['air', 'cold', 'electricity', 'water'], area: true, minCursebound: 2, inEncounter: true});
    const area = {type: 'burst', value: 10};
    assert.equal(unmetRequirement(read.requires, facts({traits: ['cold'], area, cursebound: 2, inEncounter: true})), null);
    assert.match(unmetRequirement(read.requires, facts({traits: ['cold'], area, cursebound: 1, inEncounter: true})), /cursebound/);
    assert.match(unmetRequirement(read.requires, facts({traits: ['cold'], area, cursebound: 3, inEncounter: false})), /encounter/);
});

test('the caster\'s own moves and Interacts: the table\'s', () => {
    assert.deepEqual(shape('Travel Channel').riders, [{type: 'table', text: 'You can Stride up to half your Speed before you Cast the Spell.'}]);
    const ride = shape('Ride the Spell');
    assert.deepEqual(ride.requires, {rangeOrArea: true});
    assert.match(unmetRequirement(ride.requires, facts({range: ''})), /no range or area/);
    assert.equal(unmetRequirement(ride.requires, facts({range: '30 feet'})), null);
    const reload = shape('Slot Rehearsed Reload');
    assert.deepEqual(reload.requires.table, ['from one of your wizard spell slots', 'You are wielding your makeshift spellgun']);
});

test('Tenacious Magic: the next spell at mythic proficiency', () => {
    assert.deepEqual(shape('Tenacious Magic').riders, [{type: 'mythic-proficiency'}, {type: 'table', text: 'Once per day.'}]);
});
