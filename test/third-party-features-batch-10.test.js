import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readTextRules, rulesWithText, readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 10 (2026-10-07): the passive features read from their text — Rudimentary Perfectionism's bonus (twice only from a slot), Power of
// Blood's bleed on each slot cast and its flat-check notes, Wayward Gifts' Effect found to say what its text says (plus-feature-rules.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name && entry.type !== 'spell'));

test('Rudimentary Perfectionism: twice the heightened ranks only from a slot', () => {
    const source = item('Rudimentary Perfectionism');
    const read = readTextRules(source);
    const rules = rulesWithText(source.system.rules, read);
    assert.equal(rules.length, 2);
    assert.deepEqual(rules.map(rule => [rule.value, JSON.stringify(rule.predicate)]), [['2*((@spell.level) - (@spell.baseLevel))', '["item:spell-slot"]'], ['(@spell.level) - (@spell.baseLevel)', '[{"not":"item:spell-slot"}]']]);
});

test('Power of Blood: the bleed on each slot cast, the text\'s flat-check DCs', () => {
    const source = item('Power of Blood');
    assert.deepEqual(readPassiveCastRider(source).riders, [{type: 'self-persistent', formula: 'rank', damageType: 'bleed', bypass: true}]);
    assert.deepEqual(readPassiveCastRider(source).requires, {fromSlots: true});
    const rules = rulesWithText(source.system.rules, readTextRules(source));
    const notes = rules.filter(rule => rule.key === 'Note').map(rule => rule.text);
    assert.equal(notes.length, 4);
    assert.match(notes[0], /from 15 to 12 \(or to 7 if/);
    assert.match(notes[3], /from 15 to 5 \(or to 0, an automatic success, if/);
    assert.ok(rules.some(rule => rule.key === 'FlatModifier' && rule.selector === 'hp'), 'the Hit Points kept');
});

test('Wayward Gifts: the module\'s Effect verified', () => {
    assert.deepEqual(readTextRules(item('Effect: Wayward Gifts')), {name: 'Effect: Wayward Gifts', verified: true});
    const changed = item('Effect: Wayward Gifts');
    changed.system.rules.find(rule => rule.slug === 'wayward-gifts-spell-damage').value = '@spell.level*2';
    assert.equal(readTextRules(changed), null);
});
