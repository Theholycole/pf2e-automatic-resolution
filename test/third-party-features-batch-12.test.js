import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';
import {unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 12 (2026-10-07): Magic+'s wickets, first four — Luminor, Propulsor, Verdor, Erosior (plus-feature-rules.js readWicket).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const wicket = name => readPassiveCastRider(structuredClone(items.find(entry => entry.name === name && entry.type === 'feat')));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('the wickets: threaded and overwhelming parts', () => {
    const luminor = wicket('Luminor');
    assert.deepEqual(luminor.requires, {inWicketDominion: true, fromSlotsOrFocus: true, anyTraits: ['fire', 'light']});
    assert.deepEqual(luminor.riders.map(rider => [rider.type, rider.threaded ?? false, rider.minLevel ?? 0]), [['table', true, 0], ['persistent', true, 0], ['damage-type', false, 11], ['conditions', false, 11]]);
    assert.deepEqual(luminor.riders[1], {type: 'persistent', when: 'hit-or-failed', formula: 'rank', damageType: 'fire', ifTraits: ['fire'], raisesOwn: true, followSwap: true, threaded: true});
    const propulsor = wicket('Propulsor');
    assert.deepEqual(propulsor.riders[0].attackDegrees, {success: 5, criticalSuccess: 10});
    assert.equal(propulsor.riders[3].type, 'damaged-save');
    assert.match(propulsor.riders[3].outcomes.criticalFailure, /Prone/);
    assert.deepEqual(wicket('Verdor').riders[1].degrees.criticalFailure[0].slug, 'immobilized');
    const erosior = wicket('Erosior');
    assert.deepEqual(erosior.riders.map(rider => rider.type), ['terrain', 'terrain', 'damage-type', 'degree-rules']);
    assert.deepEqual(erosior.riders[1].hazard, {formula: 'rank', damageType: 'acid', per: 'pass'});
});

test('within the dominion, from slots or Focus Points', () => {
    const requires = wicket('Luminor').requires;
    assert.match(unmetRequirement(requires, facts({traits: ['fire'], inWicketDominion: false, fromSlots: true})), /dominion/);
    assert.match(unmetRequirement(requires, facts({traits: ['fire'], inWicketDominion: true, fromSlots: false, fromFocus: false})), /spell slot or Focus/);
    assert.equal(unmetRequirement(requires, facts({traits: ['fire'], inWicketDominion: true, fromSlots: false, fromFocus: true})), null);
});
