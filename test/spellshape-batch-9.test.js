import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 9 (2026-10-05): family F — riders on the creature Heal or Harm heals (PF2e's applied healing), Cast Down's on the one it damages,
// Healing Transformation's healing at the cast; the table's and the GM's.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Defensive Recovery, Heroic Recovery, Divine Infusion: PF2e's Effects; the dice by rank and the type by spell", async () => {
    const defensive = readSpellshapeFeat(await load("feats/defensive-recovery"));
    assert.deepEqual([defensive.requires, defensive.riders[0].type, Boolean(defensive.riders[0].uuid)], [{ spells: ["Harm", "Heal"], singleTarget: true }, "healed-effect", true]);
    assert.equal(readSpellshapeFeat(await load("feats/heroic-recovery")).riders[0].type, "healed-effect");
    const infusion = readSpellshapeFeat(await load("feats/divine-infusion")).riders[0];
    assert.deepEqual([infusion.dice, infusion.faces, infusion.typeBySpell], [[{ rank: 1, number: 1 }, { rank: 5, number: 2 }, { rank: 8, number: 3 }], 6, { harm: "void", heal: "vitality" }]);
});

test("Martyr, Cleansing Spell, Purifying Spell: the caster's Hit Points; the level more; a counteract against disease or poison", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/martyr")).riders, [{ type: "martyr", dice: 1, faces: 8 }]);
    const cleansing = readSpellshapeFeat(await load("feats/cleansing-spell"));
    assert.deepEqual([cleansing.requires, cleansing.riders.map(rider => rider.type)], [{ anyTraits: ["healing"] }, ["healed-extra", "counteract-affliction", "table"]]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/purifying-spell")).riders[0], { type: "counteract-affliction", traits: ["disease", "poison"] });
});

test("Healing Transformation, Cast Down; Ebb and Flow, Echoing Channel, Interweave Dispel (the table's); Blessed Spell, Remediate (the GM's)", async () => {
    const transformation = readSpellshapeFeat(await load("feats/healing-transformation"));
    assert.deepEqual(transformation.riders, [{ type: "cast-heal", dice: 1, faces: 6, perRank: true }]);
    assert.equal(unmetRequirement(transformation.requires, facts({ traits: ["polymorph"] })), null);
    assert.equal(unmetRequirement(transformation.requires, facts({ traits: ["polymorph"], targeted: true })), "it affects more than one creature");
    for (const slug of ["ebb-and-flow", "echoing-channel", "interweave-dispel"]) assert.ok(readSpellshapeFeat(await load(`feats/${slug}`)).riders.every(rider => rider.type === "table"), slug);
    for (const slug of ["blessed-spell", "remediate"]) assert.ok(readSpellshapeFeat(await load(`feats/${slug}`)).riders.every(rider => rider.type === "note"), slug);
});
