import assert from 'node:assert/strict';
import test from 'node:test';

import {counterOptions, counters} from '../scripts/casting-rules-runtime.js';

// Spell features batch F3 (2026-10-05): the counteract outcome and the spells a creature could Counterspell with.

test('counteract outcome: critical success up to 3 ranks higher, success 1, failure only lower', () => {
    assert.equal(counters(3, 3, 6), true);
    assert.equal(counters(3, 3, 7), false);
    assert.equal(counters(2, 3, 4), true);
    assert.equal(counters(2, 3, 5), false);
    assert.equal(counters(1, 3, 2), true);
    assert.equal(counters(1, 3, 3), false);
    assert.equal(counters(0, 9, 1), false);
});

const feat = slug => ({slug});
const actorWith = ({prepared, feats, spells, slots}) => {
    const entry = {id: 'e1', name: 'Arcane', system: {prepared: {value: prepared}, tradition: {value: 'arcane'}, slots}};
    const items = new Map(spells.map(spell => [spell.id, spell]));
    return {itemTypes: {spellcastingEntry: [entry], feat: feats.map(feat), spell: spells}, items};
};

test('prepared Counterspell: the same spell, unexpended, at the cast rank', () => {
    const fireball = {id: 's1', slug: 'fireball', name: 'Fireball', system: {location: {value: 'e1'}}};
    const actor = actorWith({prepared: 'prepared', feats: ['counterspell-prepared'], spells: [fireball],
        slots: {slot3: {prepared: [{id: 's1', expended: false}, {id: 's1', expended: true}]}}});
    const options = counterOptions(actor, {slug: 'fireball', name: 'Fireball'}, 3);
    assert.equal(options.length, 1);
    assert.deepEqual([options[0].kind, options[0].index, options[0].penalty], ['Counterspell', 0, 0]);
    assert.equal(counterOptions(actor, {slug: 'haste', name: 'Haste'}, 3).length, 0);
});

test("Master's Counterspell: any slot of the rank or higher, at -2", () => {
    const other = {id: 's2', slug: 'haste', name: 'Haste', system: {location: {value: 'e1'}}};
    const actor = actorWith({prepared: 'prepared', feats: ['masters-counterspell'], spells: [other],
        slots: {slot2: {prepared: [{id: 's2'}]}, slot4: {prepared: [{id: 's2'}]}}});
    const options = counterOptions(actor, {slug: 'fireball', name: 'Fireball'}, 3);
    assert.deepEqual(options.map(option => [option.kind, option.rank, option.penalty]), [["Master's Counterspell", 4, -2]]);
});

test('spontaneous Counterspell: a known copy and an unspent slot of the rank', () => {
    const fireball = {id: 's1', slug: 'fireball', name: 'Fireball', system: {location: {value: 'e1'}}};
    const spent = actorWith({prepared: 'spontaneous', feats: ['counterspell-spontaneous'], spells: [fireball], slots: {slot3: {value: 0}}});
    assert.equal(counterOptions(spent, {slug: 'fireball', name: 'Fireball'}, 3).length, 0);
    const ready = actorWith({prepared: 'spontaneous', feats: ['counterspell-spontaneous'], spells: [fireball], slots: {slot3: {value: 2}}});
    assert.equal(counterOptions(ready, {slug: 'fireball', name: 'Fireball'}, 3)[0].kind, 'Counterspell');
});
