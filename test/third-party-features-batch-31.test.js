import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider, readTextRules} from '../src/compiler/plus-feature-rules.js';
import {readEnergyRune} from '../scripts/spellshape-runtime.js';

// Third-party features batch 31 (2026-10-07): Magic+'s power ring runes — Immobilizing, Ramming, Scourging, Perishing, Overwhelming, Energy (the saves, the charge and the ray are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = (name, selections) => { const found = structuredClone(items.find(entry => entry.name === name)); if (selections) found.flags = {pf2e: {rulesSelections: selections}}; return found; };

test('Immobilizing: slowed 1 on a crit with the rune\'s trait, DC 24 Fortitude', () => {
    const read = readPassiveCastRider(item('Immobilizing', {trait: 'cold'}));
    assert.deepEqual(read.requires, {attack: true, noDuration: true, traits: ['cold']});
    assert.deepEqual([read.riders[0].type, read.riders[0].save, read.riders[0].failure.conditions[0].slug, read.riders[0].failure.conditions[0].value], ['attack-crit', {statistic: 'fortitude', dc: 24}, 'slowed', 1]);
    assert.deepEqual(readPassiveCastRider(item('Immobilizing')).riders, []);
});

test('Ramming, Scourging, Perishing', () => {
    assert.deepEqual(readPassiveCastRider(item('Ramming (Greater)')).riders[0], {type: 'attack-crit', save: {statistic: 'fortitude', dc: 32}, failure: {push: 20}});
    const physical = readPassiveCastRider(item('Scourging', {scourging: {trait: 'force', damageType: 'bleed'}}));
    assert.deepEqual([physical.requires.damageTypesAny, physical.riders[0].persistent], [['bludgeoning', 'piercing', 'slashing'], {formula: '1d10', damageType: 'bleed'}]);
    const die = readPassiveCastRider(item('Perishing')).riders[0];
    assert.deepEqual([die.natural, die.reaction.name, die.save, die.reaction.traits, die.reaction.rank], [20, 'Die!', {statistic: 'fortitude', dc: 37}, ['concentrate', 'death', 'incapacitation'], 9]);
});

test('Overwhelming: a 19 with Veracious Spell only (the module\'s broader rule dropped); Energy\'s ray', () => {
    assert.deepEqual(readPassiveCastRider(item('Overwhelming')).riders, [{type: 'natural-crit', natural: 19, withVeracious: true}]);
    assert.ok(readTextRules(item('Overwhelming'))?.drop);
    assert.deepEqual(readEnergyRune(item('Energy')), {formula: '5d4', minutes: 1});
});
