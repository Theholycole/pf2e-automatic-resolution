import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';
import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 13 (2026-10-07): the other seven wickets — Mortisor, Savior, Atmosphor, Desolator, Fabricator, Magnetor, Ardor — and Wicket Infusion.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const wicket = name => readPassiveCastRider(structuredClone(items.find(entry => entry.name === name && entry.type === 'feat')));

test('the seven wickets', () => {
    const types = name => wicket(name).riders.map(rider => rider.type);
    assert.deepEqual(types('Mortisor'), ['targeted-condition', 'table', 'damage-type', 'on-kill-rules']);
    assert.deepEqual(wicket('Mortisor').riders[0].unlessImmune, ['emotion', 'fear', 'mental']);
    assert.deepEqual(types('Savior'), ['healed-full-effect', 'table']);
    assert.equal(wicket('Savior').riders[0].immunityMinutes, 1);
    assert.deepEqual(types('Atmosphor'), ['self-rules', 'follow', 'table', 'table', 'damage-type']);
    assert.deepEqual(wicket('Atmosphor').riders[0].rules, [{key: 'BaseSpeed', selector: 'fly', value: '@actor.attributes.speed.value'}]);
    assert.deepEqual(types('Desolator'), ['note', 'damage-type', 'note']);
    assert.deepEqual(wicket('Fabricator').riders[0].options.map(option => option.value), ['penalty', 'bonus']);
    assert.deepEqual(types('Magnetor'), ['magnet-pull', 'damage-type', 'target-rules']);
    assert.deepEqual(wicket('Ardor').riders[0], {type: 'twin-target', ifTraits: ['auditory', 'emotion'], saveBonus: 2, note: "Halve the spell's durations for both creatures (minimum 1 round).", threaded: true});
});

test('Wicket Infusion', () => {
    const read = readSpellshapeFeat(structuredClone(items.find(entry => entry.name === 'Wicket Infusion')));
    assert.deepEqual(read.riders[0], {type: 'infuse-trait'});
    assert.deepEqual(read.requires, {fromSlotsOrFocus: true});
});
