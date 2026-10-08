import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {readWand} from '../src/compiler/spellshape-readers.js';
import {scaledDuration, diceAtRank} from '../scripts/spellshape-runtime.js';

// Spellshape batch 16 (2026-10-05): the GM-note wands automated ("automate as much as you can") — the riders their runtime follows.

const fixture = slug => JSON.parse(readFileSync(new URL(`../.cache/pf2e-spellshape-fixtures/wands/${slug}.json`, import.meta.url), 'utf8'));
const riders = slug => readWand(fixture(slug))?.riders ?? [];
const ofType = (slug, type) => riders(slug).find(rider => rider.type === type);

test('watching wands: thorns, orbs, the web, the probe, the shards, the echoes, the poisoned wall', () => {
    assert.deepEqual(ofType('wand-of-hawthorn-2nd-rank', 'thorns'), {type: 'thorns', formula: '1d4', damageType: 'piercing'});
    assert.deepEqual(ofType('wand-of-shocking-haze', 'haze-orbs'), {type: 'haze-orbs', formula: '5', damageType: 'electricity'});
    assert.deepEqual(ofType('wand-of-the-spider-2nd-rank-spell', 'failed-check-damage'), {type: 'failed-check-damage', formula: '1d6', damageType: 'poison'});
    assert.deepEqual(ofType('wand-of-traitorous-thoughts', 'first-success-worse'), {type: 'first-success-worse', skill: 'deception'});
    assert.deepEqual(ofType('wand-of-shardstorm-3rd-rank-spell', 'turn-start-barrage'), {type: 'turn-start-barrage', actions: 1, rounds: 10});
    assert.deepEqual(ofType('wand-of-thundering-echoes-3rd-rank-spell', 'echo-recast'), {type: 'echo-recast', faces: 10, minDice: 2});
    const exposes = ofType('wand-of-toxic-blades-6th-rank', 'damage-exposes');
    assert.equal(exposes.name, 'Cave Worm Venom');
});

test('area and card wands: Remaining Air, Fey Flames, Caustic Effluence, the Ash Puppet, refraction, the frailty spread', () => {
    assert.match(ofType('wand-of-choking-mist-2nd-rank', 'area-effect').uuid, /^Compendium\.pf2e\.other-effects\.Item\./);
    const fey = ofType('wand-of-fey-flames', 'area-save-effect');
    assert.equal(fey.statistic, 'will');
    assert.match(fey.uuid ?? '', /^Compendium\.pf2e\.equipment-effects\.Item\./);
    assert.deepEqual(ofType('wand-of-caustic-effluence', 'prone-damage'), {type: 'prone-damage', formula: '1d6', damageType: 'acid', statistic: 'reflex'});
    const ash = ofType('wand-of-the-ash-puppet', 'ash-puppet');
    assert.equal(ash.rounds, 10);
    assert.match(ash.uuid, /^Compendium\./);
});

test('Continuation: a duration times 1.5, in a smaller unit when not whole', () => {
    assert.deepEqual(scaledDuration(10, 'minutes', 1.5), {value: 15, unit: 'minutes'});
    assert.deepEqual(scaledDuration(1, 'minutes', 1.5), {value: 15, unit: 'rounds'});
    assert.deepEqual(scaledDuration(1, 'hours', 1.5), {value: 90, unit: 'minutes'});
    assert.deepEqual(scaledDuration(3, 'rounds', 1.5), {value: 5, unit: 'rounds'});
});

test('Thundering Echoes: the dice of a spell at a lower rank', () => {
    const noiseBlast = {system: {level: {value: 2}, damage: {a: {formula: '2d10', type: 'sonic'}}, heightening: {type: 'interval', interval: 1, damage: {a: '1d10'}}}};
    assert.deepEqual(diceAtRank(noiseBlast, 3), {dice: 3, faces: 10});
    assert.deepEqual(diceAtRank(noiseBlast, 2), {dice: 2, faces: 10});
    assert.deepEqual(diceAtRank(noiseBlast, 1), {dice: 1, faces: 10});
});
