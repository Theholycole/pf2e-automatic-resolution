import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, readWand, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 8 (2026-10-05): family D — the damage's type and metal, resistances ignored up to the caster's level, nonlethal.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Spiritual Secret and Golden Dragon's Bounty: spirit instead; the chosen metal (adamantine from 14th)", async () => {
    const secret = readSpellshapeFeat(await load("feats/spiritual-secret"));
    assert.deepEqual([secret.requires, secret.riders], [{ table: ["a witch cantrip or spell"], damaging: true }, [{ type: "damage-type", to: "spirit" }]]);
    const bounty = readSpellshapeFeat(await load("feats/golden-dragons-bounty"));
    assert.deepEqual(bounty.riders, [{ type: "damage-material", choice: ["cold-iron", "silver", "steel"], byLevel: { level: 14, add: "adamantine" } }]);
    assert.equal(unmetRequirement(bounty.requires, facts({ damageTypes: ["fire"] })), "it deals no bludgeoning, piercing, slashing damage");
});

test("Overwhelming Energy, Surging Might, Overwhelming Breath: resistances ignored up to the level, by type", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/overwhelming-energy")).riders, [{ type: "ignore-resistance", types: ["acid", "cold", "electricity", "fire", "sonic"], value: "level" }]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/surging-might")).riders[0].types, ["spirit", "vitality", "void"]);
    const breath = readSpellshapeFeat(await load("feats/overwhelming-breath"));
    assert.deepEqual([breath.requires, breath.riders[0].types], [{ anyTraits: ["monk"], noDuration: true }, ["physical", "bludgeoning", "piercing", "slashing"]]);
});

test("Nonlethal Spell and Wand of Mercy (optional); Steam Spell the table's; Bizarre Transformation the GM's", async () => {
    const nonlethal = readSpellshapeFeat(await load("feats/nonlethal-spell"));
    assert.deepEqual([nonlethal.requires, nonlethal.riders], [{ damaging: true, notTraits: ["death", "void"] }, [{ type: "nonlethal" }]]);
    assert.equal(unmetRequirement(nonlethal.requires, facts({ damageTypes: ["void"], traits: ["void"] })), "it has the void trait");
    const mercy = readWand(await load("wands/wand-of-mercy-1st-rank"));
    assert.deepEqual([mercy.requires, mercy.riders], [{ actions: [1, 2], damaging: true, notTraits: ["death", "void", "nonlethal"], rank: 1 }, [{ type: "nonlethal", optional: true }]]);
    assert.ok(readSpellshapeFeat(await load("feats/steam-spell")).riders.every(rider => rider.type === "table"));
    assert.deepEqual(readSpellshapeFeat(await load("feats/bizarre-transformation")).riders.map(rider => rider.type), ["note", "note"]);
});
