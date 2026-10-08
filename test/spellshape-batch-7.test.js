import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 7 (2026-10-05): family J — how the spell is cast: the slot not spent (given back), and the table's (subtle, fewer actions,
// reactions, identifying, cover, senses, the spell kept).
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 3, actions: 2, attack: false, ...extra });

test("The Conduits and Unlimited Potential: 5th rank or lower, no duration; the slot given back", async () => {
    for (const slug of ["bloodline-conduit", "ley-line-conduit", "mystery-conduit", "unlimited-potential"]) {
        const feat = readSpellshapeFeat(await load(`feats/${slug}`));
        assert.deepEqual([feat.requires, feat.riders], [{ maxRank: 5, noDuration: true }, [{ type: "slot-refund" }]], slug);
    }
    const conduit = readSpellshapeFeat(await load("feats/mystery-conduit"));
    assert.equal(unmetRequirement(conduit.requires, facts({ rank: 6 })), "it's above rank 5");
    assert.equal(unmetRequirement(conduit.requires, facts({ hasDuration: true })), "it has a duration");
});

test("Galvanize Spell and Sepulchral Sublimation: the slot given back; their costs and limits the table's", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/galvanize-spell")).riders.map(rider => rider.type), ["table", "slot-refund"]);
    const sepulchral = readSpellshapeFeat(await load("feats/sepulchral-sublimation"));
    assert.deepEqual([sepulchral.requires.table, sepulchral.riders[0].type], [["a necromancy spell from a spell slot"], "slot-refund"]);
});

test("The table's: subtle, fewer actions, reactions, identifying, cover, senses, Look Again", async () => {
    const slugs = ["conceal-spell", "cryptic-spell", "melodious-spell", "humble-spell", "quickened-casting", "apparitions-quickening", "quickened-attunement",
        "battlefield-arcana", "elaborate-flourish", "incriminating-spell", "through-spell", "wind-tossed-spell", "unusual-composition", "look-again"];
    for (const slug of slugs) assert.ok(readSpellshapeFeat(await load(`feats/${slug}`))?.riders.every(rider => rider.type === "table"), slug);
    assert.equal(unmetRequirement(readSpellshapeFeat(await load("feats/through-spell")).requires, facts()), "it has no spell attack roll");
    assert.deepEqual(readSpellshapeFeat(await load("feats/incriminating-spell")).requires, { anyTraits: ["mental"] });
});
