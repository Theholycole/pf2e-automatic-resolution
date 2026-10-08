import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemCasts, readItemCastNumbers} from '../src/compiler/item-casts.js';

// Spell features batch F5 (2026-10-05): items that cast an official spell with numbers of their own — the spellhearts (119, exported) and the weapons
// and charms (in the spell-stat export).
const fixture = name => JSON.parse(fs.readFileSync(new URL(`../.cache/pf2e-spell-features/${name}.json`, import.meta.url)));
const hearts = fixture('spellhearts'), stat = fixture('spell-stat-items');
const read = (list, name) => readItemCasts(list.find(item => item.name === name));

test('every spellheart is read: its casts, and its benefits after a cast', () => {
    assert.equal(hearts.length, 119);
    assert.deepEqual(hearts.filter(item => !readItemCasts(item)).map(item => item.name), []);
    const crystal = read(hearts, 'Rime Crystal (Major)');
    assert.deepEqual(crystal.numbers, {attack: 20, dc: 30});
    assert.deepEqual(crystal.casts.map(cast => [cast.name, cast.rank, cast.frequency]), [['Frostbite', null, null], ['Ice Storm', null, 'once per day'], ['Howling Blizzard', null, 'once per day']]);
    assert.equal(crystal.cantripRank, 7);
    assert.deepEqual(crystal.after.map(entry => [entry.where, entry.when, entry.effect]), [['weapon', {anyTraits: ['cold']}, 'Compendium.pf2e.equipment-effects.Item.IiDpW99zrh7zHxmQ']]);
});

test("the numbers' wordings; a spellheart that states none", () => {
    assert.deepEqual(readItemCastNumbers('The spell DC of any spell cast by activating this item is 34.'), {attack: null, dc: 34});
    assert.deepEqual(readItemCastNumbers('The spell attack roll of any spell cast by Activating this item is +7 and the spell DC 17.'), {attack: 7, dc: 17});
    assert.deepEqual(readItemCastNumbers('The spell attack modifier of any spell cast by activating this item is +13.'), {attack: 13, dc: null});
    assert.deepEqual(read(hearts, 'Helping Hand').numbers, {attack: null, dc: null});
});

test('benefits PF2e gives no Effect for: dice on the weapon, Concealed, else a note', () => {
    assert.deepEqual(read(hearts, 'Foxglove Token (Greater)').after[0].built, {type: 'strike-dice', diceNumber: 1, dieSize: 'd6', damageType: 'poison', until: 'caster-next-turn-end'});
    assert.equal(read(hearts, 'Thirsty Chalice').after.find(entry => entry.where === 'armor').built.list[0].slug, 'concealed');
    assert.equal(read(hearts, 'Resonating Fork').after[0].built, null);
    assert.equal(read(hearts, 'Devilwing Badge (Major)').after[0].effect, 'Compendium.pf2e.equipment-effects.Item.JuyEDBlFwyDguEzG');
    assert.deepEqual(read(hearts, 'Polished Demon Horn').after[0].when, {any: true, school: ['enchantment']});
});

test('weapons and charms that cast one spell', () => {
    assert.deepEqual(read(stat, "Dragon's Eye Charm").numbers, {attack: 13, dc: null});
    assert.deepEqual(read(stat, 'Trident of the Azarketis').casts.map(cast => [cast.name, cast.rank]), [['Hydraulic Torrent', 5]]);
    const hammer = read(stat, 'Sky Hammer');
    assert.deepEqual([hammer.numbers.dc, hammer.casts[0].tradition, hammer.casts[0].casterImmune], [45, 'arcane', true]);
    assert.equal(read(stat, 'Searing Blade').numbers.attack, 'strike');
    assert.equal(read(stat, 'Rune of Sin'), null);
});
