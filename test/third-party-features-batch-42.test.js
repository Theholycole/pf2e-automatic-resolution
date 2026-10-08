import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape} from '../src/compiler/item-spellshape.js';

// Third-party features batch 42 (2026-10-08): PF2e's catalysts (the user: build them here). Every catalyst armed for its named spell; the riders by text.
const catalysts = JSON.parse(fs.readFileSync(new URL('../.cache/pf2e-spell-features/pf2e-catalysts.json', import.meta.url)));
const read = name => { const x = catalysts.find(entry => entry.name === name); return readItemSpellshape({name: x.name, type: 'consumable', system: {traits: {value: x.traits}, description: {value: x.text}, level: {value: x.level}}})?.activations?.[0]; };

test('all 107 catalysts arm their spell', () => {
    assert.equal(catalysts.length, 107);
    // (Batch 43: Deathless Light arms any light spell — its trait, not the one spell linked.)
    for (const entry of catalysts) assert.ok(read(entry.name)?.requires?.spells?.length || read(entry.name)?.requires?.traits?.length, entry.name);
});

test('the riders', () => {
    assert.deepEqual(read('Backdraft Bead').riders, [{type: 'push', degrees: {failure: 5, criticalFailure: 10}, from: {burst: 'center'}}]);
    assert.deepEqual(read('Firestarter Pellets (Greater)').riders.map(r => [r.formula, r.degrees]), [['2d6', ['failure']], ['4d6', ['criticalFailure']]]);
    assert.deepEqual(read('Discordant Strings').riders[0].degrees.failure[0].slug, 'deafened');
    assert.deepEqual(read('Wemmuth Trinket').riders[0], {type: 'flat-damage', formula: 'rank', damageType: 'piercing', degrees: ['failure', 'criticalFailure']});
    assert.deepEqual(read('Frigid Rebuke').riders, [{type: 'damage-type', from: 'fire', to: 'cold'}]);
    assert.equal(read("Healer's Gel").riders[0].type, 'healed-effect');
    assert.deepEqual(read('Thunderbird Tuft (Lesser)').riders[0], {type: 'retaliate', formula: '1d4', metalFormula: '1d6', damageType: 'electricity', statistic: null, hitOnly: true, nonReach: true, rounds: 1});
    assert.deepEqual(read('Wood-Rotted Root (Lesser)').riders[0], {type: 'hurt-spores', radius: 5, statistic: 'fortitude', dc: 15, formula: '1', damageType: 'poison'});
    assert.deepEqual(read('Defiled Costa (Greater)').riders[0].traits, ['incapacitation']);
    assert.deepEqual(read('Bougainvillea Blossom (Lesser)').riders[0].hazard, {formula: '1', damageType: 'piercing', per: 'square'});
    assert.deepEqual([read('Dragon Eye').requires, read('Dragon Eye').riders.map(r => r.type)], [{spells: ['Breathe Fire'], minRank: 3}, ['conditions', 'self-effect']]);
    assert.deepEqual(read('Nevercold (Compressed)').requires.maxRank, 6);
    // (Batch 43: the GM's note became a reminder Effect on the caster.)
    assert.deepEqual(read('Courier\'s Cryptex').riders.map(r => [r.type, r.who]), [['reminder', 'caster']]);
});
