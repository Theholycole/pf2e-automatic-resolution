import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 68 (2026-10-07): the last two (user decisions 2026-10-07) — Magic+'s empty Dynamic Breathe Fire cast as its written copy (its variant asked); Patron's
// Apocalypse with the book's table of apocalypses (the user's text): four 10-foot bursts, each type's damage (basic Reflex) and effects, the Sustain's 30-foot move
// leaving 10-damage hazardous terrain.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = (source, referencedSpells = new Map()) => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells});

test('the empty Dynamic Breathe Fire casts its written copy', () => {
    const empty = structuredClone(items.find(item => item._id === 'dtY2srRmgO1eZbGR'));
    const written = items.find(item => item._id === 'rgKVFyjIvvCSzr43');
    assert.equal(empty.system.description.value, '');
    const referenced = new Map([[`Compendium.${written._pack}.Item.${written._id}`, written]]);
    const plan = compile(empty, referenced);
    assert.equal(plan.resolution.kind, 'proxy-cast');
    assert.deepEqual([plan.resolution.proxyCast.variants, plan.resolution.proxyCast.list[0].uuid], [true, `Compendium.${written._pack}.Item.${written._id}`]);
    assert.notEqual(compile(structuredClone(empty)).resolution.kind, 'proxy-cast');
});

test("Patron's Apocalypse: the bursts and the book's apocalypses", () => {
    const plan = compile(spell("Patron's Apocalypse"));
    assert.equal(plan.resolution.kind, 'patron-apocalypse');
    const data = plan.resolution.patronApocalypse;
    assert.deepEqual([data.count, data.radius, data.move, data.terrain, data.statistic, data.seconds, data.sustained], [4, 10, 30, 10, 'reflex', 60, true]);
    assert.deepEqual(Object.values(data.types).map(entry => `${entry.name} ${entry.formula} ${entry.type}`),
        ['Cosmic 10d6 force', 'Corpses 12d6 void', 'Flames 12d6 fire', 'Floods 15d6 bludgeoning', 'Frost 12d6 cold', 'Nature 15d6 piercing', 'Plague 12d6 poison', 'Rapture 10d6 spirit']);
    assert.deepEqual(data.types.nature.always, {persistent: {formula: '10', type: 'bleed'}});
    assert.equal(data.types.frost.always.rules[0].value, -10);
    assert.equal(data.types.plague.failure.conditions[0].slug, 'sickened');
    assert.deepEqual([data.types.rapture.enemiesOnly, data.types.flames.concealment], [true, true]);
});
