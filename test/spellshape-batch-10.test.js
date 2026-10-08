import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 10 (2026-10-05): family G (the targets a spellshape singles out) and the cast's rank and DC (Split Hex, Mythic Heightening,
// Simple Mastery, Mythic Casting).
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Split Shot and Tempest-Sun Redirection: the second target's half damage alone; the spared targets' rank less and the caster's twice-rank resistance", async () => {
    const split = readSpellshapeFeat(await load("feats/split-shot"));
    assert.deepEqual([split.requires, split.riders[0]], [{ noDuration: true, attack: true, singleTarget: true }, { type: "split-target", half: true, damageOnly: true }]);
    assert.equal(unmetRequirement(split.requires, facts({ singleTarget: true })), "it has no spell attack roll");
    const tempest = readSpellshapeFeat(await load("feats/tempest-sun-redirection"));
    assert.deepEqual([tempest.requires, tempest.riders], [{ fromSlots: true, damaging: true }, [{ type: "shield-targets", reduce: "rank", retaliate: "2rank" }]]);
});

test("Split Hex, Mythic Heightening, Simple Mastery, Mythic Casting: the rank and mythic proficiency", async () => {
    const hex = readSpellshapeFeat(await load("feats/split-hex"));
    assert.deepEqual([hex.requires, hex.riders[0]], [{ anyTraits: ["hex"], singleTarget: true }, { type: "rank-change", by: -2 }]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/mythic-heightening")).riders.slice(0, 2), [{ type: "rank-change", to: "highest" }, { type: "mythic-proficiency" }]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/simple-mastery")).riders, [{ type: "rank-change", by: 1, cap: "highest" }]);
    assert.equal(readSpellshapeFeat(await load("feats/mythic-casting")).riders[0].type, "mythic-proficiency");
    assert.equal(readSpellshapeFeat(await load("feats/contagious-spell")).riders[0].type, "table");
    assert.equal(readSpellshapeFeat(await load("feats/heightened-captivation")).riders[0].type, "note");
});
