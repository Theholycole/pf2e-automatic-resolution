import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider, readActionCast} from '../src/compiler/plus-feature-rules.js';
import {readItemCasts} from '../src/compiler/item-casts.js';
import {unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 33 (2026-10-07): cast riders — Arcane Generator and Transmogrification Boost, Essence Strike, Essence Mystic Dedication's havok trait, Geojibom's Guidance.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Arcane Generator and Transmogrification Boost: a single-target damaging save spell with no duration', () => {
    const generator = readPassiveCastRider(item('Arcane Generator')), boost = readPassiveCastRider(item('Transmogrification Boost'));
    assert.deepEqual(generator.requires, {hasSave: true, damaging: true, noDuration: true, singleTarget: true});
    assert.deepEqual([generator.riders, boost.riders], [[{type: 'borrowed-damage', from: 'overdrive', whileOverdrive: true}], [{type: 'borrowed-damage', from: 'offensive-boost', whileOverdrive: false}]]);
    const facts = {traits: [], damageTypes: ['fire'], hasDuration: false, singleTarget: true, saveStatistic: null};
    assert.equal(unmetRequirement(generator.requires, facts), 'it requires no save');
    assert.equal(unmetRequirement(generator.requires, {...facts, saveStatistic: 'reflex'}), null);
});

test('Essence Strike, Essence Mystic Dedication, Geojibom\'s Guidance', () => {
    assert.deepEqual([readActionCast(item('Essence Strike')).kind, readActionCast(item('Essence Strike')).immunityMinutes], ['essence-strike', 10]);
    const mystic = readPassiveCastRider(item('Essence Mystic Dedication'));
    assert.deepEqual([mystic.requires, mystic.riders[0].type, mystic.riders[0].effect.name], [{traits: ['conflux'], notTraits: ['havok']}, 'havok-choice', 'Effect: Essence Mystic Dedication']);
    const [guidance] = readItemCasts(item("Geojibom's Guidance")).casts;
    assert.deepEqual([guidance.name, guidance.frequency, guidance.selfLight.bright, guidance.selfLight.dim, guidance.selfLight.minutes], ['Revealing Light', 'once per day', 10, 20, 1]);
});
