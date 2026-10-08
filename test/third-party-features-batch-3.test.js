import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 3 (2026-10-07): Safe Spell, Compressed Spell, Reshaped Spell, Huddle Channel, The Lurking Storm, Sacrificial Spell, Transmute Spell
// (plus-spellshapes.js).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const shape = name => readSpellshapeFeat(structuredClone(items.find(item => item.name === name && item.type !== 'spell' && (item.system.traits?.value ?? []).includes('spellshape'))));
const facts = extra => ({traits: [], damageTypes: [], ...extra});

test('Safe Spell and Compressed Spell: the targets on the card', () => {
    assert.deepEqual(shape('Safe Spell').riders, [{type: 'exclude-allies', count: {base: 2, from: 10, every: 4}}]);
    assert.deepEqual(shape('Safe Spell').requires, {noDuration: true, damaging: true, area: true});
    const compressed = shape('Compressed Spell');
    assert.deepEqual(compressed.riders, [{type: 'compress', penalty: 2, over: {burst: 30, cone: 45, line: 60}, bigPenalty: 3}]);
    assert.match(unmetRequirement(compressed.requires, facts({area: {type: 'emanation', value: 10}, saveStatistic: 'reflex'})), /isn't a burst/);
    assert.equal(unmetRequirement(compressed.requires, facts({area: {type: 'cone', value: 15}, saveStatistic: 'reflex'})), null);
});

test('Reshaped Spell, Huddle Channel', () => {
    assert.deepEqual(shape('Reshaped Spell').riders, [{type: 'reshape', swap: {cone: 'line', line: 'cone'}, lineFactor: 2}]);
    const huddle = shape('Huddle Channel');
    assert.deepEqual(huddle.requires, {spells: ['Harm', 'Heal'], actions: [1], singleTarget: true});
    assert.equal(huddle.riders[0].type, 'table');
});

test('The Lurking Storm, Sacrificial Spell, Transmute Spell', () => {
    const storm = shape('The Lurking Storm');
    assert.deepEqual(storm.riders, [{type: 'damage-split', types: ['bludgeoning', 'electricity']}]);
    assert.match(unmetRequirement(storm.requires, facts({traits: ['cold'], damageTypes: ['cold']})), /no bludgeoning/);
    assert.equal(unmetRequirement(storm.requires, facts({traits: ['electricity'], damageTypes: ['electricity']})), null);
    const sacrificial = shape('Sacrificial Spell');
    assert.deepEqual(sacrificial.requires, {spells: ['Heal'], table: ['all your targets are living creatures']});
    assert.deepEqual(sacrificial.riders[0].rules, [{key: 'DamageDice', selector: 'spell-healing', predicate: ['item:slug:heal'], override: {dieSize: 'd12'}}]);
    const transmute = shape('Transmute Spell').riders[0];
    assert.deepEqual(transmute.essences.map(essence => [essence.name, essence.to]), [['Matter', ['acid', 'cold', 'electricity', 'fire']], ['Mind', ['mental']], ['Spirit', ['spirit']], ['Life', ['vitality', 'void']]]);
    assert.deepEqual(transmute.essences[2].onlyWeakTo, ['holy', 'spirit', 'unholy']);
    assert.deepEqual(transmute.essences[1].extra, {formula: 'rank', damageType: 'mental'});
});
