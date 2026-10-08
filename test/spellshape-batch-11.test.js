import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 11 (2026-10-05): families H (terrain the spellshape makes) and I (time: Echoing Spell's second casting, Form Control's rank).
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Charred Remains, Snowdrift Spell, Garland Spell: the area's terrain; snow around a creature; the garland's burst", async () => {
    const charred = readSpellshapeFeat(await load("feats/charred-remains"));
    assert.deepEqual(charred.riders, [{ type: "terrain", where: "area", difficult: true, hazard: { formula: "1", damageType: "fire", per: "square" }, rounds: 10 }]);
    assert.deepEqual(charred.requires, { area: true, anyTraits: ["fire"] });
    const snow = readSpellshapeFeat(await load("feats/snowdrift-spell"));
    assert.deepEqual([snow.requires, snow.riders[0]], [{ anyTraits: ["air", "water", "cold"], notTraits: ["fire"] }, { type: "terrain", where: "around-creature", difficult: true, until: "caster-turn-start" }]);
    assert.equal(unmetRequirement(snow.requires, facts({ traits: ["cold", "fire"] })), "it has the fire trait");
    const garland = readSpellshapeFeat(await load("feats/garland-spell")).riders[0];
    assert.deepEqual([garland.feet, garland.difficult, garland.rounds, garland.exemptCaster, garland.hazard.choice, garland.hazard.oncePerTurn, garland.hazard.dice.at(-1)],
        [10, true, 10, true, { thorns: "piercing", vines: "poison" }, true, { level: 20, number: 4 }]);
});

test("Rockslide Spell, Worldsphere Gravity: the GM's notes; Worldsphere's 5th rank", async () => {
    assert.ok(readSpellshapeFeat(await load("feats/rockslide-spell")).riders.every(rider => rider.type === "note"));
    const worldsphere = readSpellshapeFeat(await load("feats/worldsphere-gravity"));
    assert.equal(unmetRequirement(worldsphere.requires, facts({ rank: 4, area: { type: "burst", value: 20 }, fromSlots: true })), "it's below rank 5");
});

test("Echoing Spell, Form Control, Into the Future, Sow Spell", async () => {
    const echoing = readSpellshapeFeat(await load("feats/echoing-spell"));
    assert.deepEqual([echoing.requires, echoing.riders], [{ maxRank: 4, noDuration: true }, [{ type: "echo", until: "caster-next-turn-end" }]]);
    const form = readSpellshapeFeat(await load("feats/form-control"));
    assert.deepEqual([form.requires, form.riders[0]], [{ spells: ["Untamed Form"] }, { type: "rank-change", by: -2 }]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/into-the-future")).requires, { actions: [1, 2] });
    assert.ok(readSpellshapeFeat(await load("feats/sow-spell")).riders.every(rider => rider.type === "note"));
});
