import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 22 (2026-10-07): Magus+'s Spellstrike variants — Imposing, Pummeling, Flaying, Banishing, Living Grimoire, Inverted Energy.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name && entry._pack?.startsWith('magus')));
const facts = extra => ({actions: 2, attack: true, saves: [], traits: [], damageTypes: ['fire'], ...extra});

test('Imposing Spellstrike: its rows, Arcane Cascade and heavy armor checked', () => {
    const read = readSpellshapeFeat(item('Imposing Spellstrike'));
    assert.deepEqual(read.requires, {actions: [1, 2], attackOrSave: true, inArcaneCascade: true, heavyArmor: true, table: ['your Spellstrike is charged']});
    const rows = read.riders[0].rows;
    assert.deepEqual(rows.criticalSuccess[0].rules.map(rule => rule.value), [-2, -3]);
    assert.deepEqual(rows.success[0].rules.map(rule => rule.value), [-1, -2]);
    assert.equal(unmetRequirement(read.requires, facts({inArcaneCascade: true, heavyArmor: false})), "you aren't wearing heavy armor");
    assert.equal(unmetRequirement(read.requires, facts({inArcaneCascade: false, heavyArmor: true})), "you aren't in Arcane Cascade");
});

test('Pummeling, Flaying and Banishing', () => {
    const pummel = readSpellshapeFeat(item('Pummeling Spellstrike')).riders[0].rows;
    assert.deepEqual([pummel.criticalSuccess[0].feet, pummel.success[0].feet], [10, 5]);
    const flay = readSpellshapeFeat(item('Flaying Spellstrike')).riders[0].always[0];
    assert.deepEqual([flay.skill, flay.value, flay.criticalMultiplier], ['arcana', {base: 3, specialization: 5, greater: 7}, 2]);
    const banish = readSpellshapeFeat(item('Banishing Spellstrike'));
    const save = banish.riders[0].hit[0];
    assert.deepEqual([save.statistic, save.incapacitation, save.rows.criticalSuccess.casterCondition, save.rows.criticalFailure.cannotReturn], ['will', true, {slug: 'stunned', value: 1}, '1 week']);
    assert.ok(banish.requires.table.includes("against a creature that isn't on its home plane"));
});

test('Living Grimoire and Inverted Energy', () => {
    const grimoire = readSpellshapeFeat(item('Living Grimoire')).riders[0].rows;
    assert.deepEqual([grimoire.success[0].until, grimoire.criticalSuccess[0].rounds, grimoire.success[0].againstCaster], ['caster-next-turn-end', 10, -1]);
    const inverted = readSpellshapeFeat(item('Inverted Energy Spellstrike'));
    assert.deepEqual(inverted.requires.damageTypesAny, ['acid', 'cold', 'electricity', 'fire', 'force', 'void', 'vitality', 'sonic']);
    assert.deepEqual(inverted.riders.map(rider => rider.type), ['transmute', 'spellstrike', 'table']);
    assert.deepEqual(inverted.riders[0].essences.find(essence => essence.name === 'fire').to, ['acid', 'cold', 'electricity', 'force', 'void', 'vitality', 'sonic']);
});
