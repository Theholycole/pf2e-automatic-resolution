import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {readWand} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 14 (2026-10-05): the wands — every one read: its mechanics, or its own rules told to the GM.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));

test("The Snowfields, Hopeless Night, Crushing Leaps, Slaughter: terrain, a turn-end save, the landing, a kill's burst", async () => {
    assert.deepEqual(readWand(await load("wands/wand-of-the-snowfields-5th-rank-spell")).riders, [{ type: "terrain", where: "area", difficult: true, hazard: null, rounds: 10 }]);
    const night = readWand(await load("wands/wand-of-hopeless-night-2nd-rank-spell")).riders[0];
    assert.deepEqual([night.rounds, night.hazard.per, night.hazard.statistic, night.hazard.dc], ["spell", "turn-end-save", "will", 20]);
    assert.match(night.hazard.outcomes.criticalFailure, /\{Frightened 2\}\.$/);
    const leaps = readWand(await load("wands/wand-of-crushing-leaps")).riders.find(rider => rider.type === "landing");
    assert.deepEqual([leaps.feet, leaps.condition.slug, leaps.terrainRounds], [5, "off-guard", 10]);
    assert.deepEqual(readWand(await load("wands/wand-of-slaughter-7th-rank-spell")).riders, [{ type: "on-kill-burst", feet: 20, formula: "14", damageType: "void", living: true }]);
});

test("Mental Purification, Arboreal Wand, Overflowing Life, Cyrusian Wand: counteracts, the turn's healing, mythic proficiency", async () => {
    assert.deepEqual(readWand(await load("wands/wand-of-mental-purification-1st-rank")).riders, [{ type: "counteract-effect", traits: ["mental"], rankBonus: 1 }]);
    assert.deepEqual(readWand(await load("wands/arboreal-wand-rank-2")).riders, [{ type: "counteract-affliction", traits: [], anyAffliction: true, rank: "half-item-level" }]);
    assert.deepEqual(readWand(await load("wands/wand-of-overflowing-life-3rd-rank-spell")).riders, [{ type: "turn-start-heal", rank: 3, spell: "Heal", actions: 1 }]);
    assert.equal(readWand(await load("wands/cyrusian-wand-1st-rank-spell")).riders[0].optional, true);
});

test("Every wand is read; plain wands have nothing; the rest's own rules are the GM's notes", async () => {
    const files = await readdir(new URL("wands/", base));
    const unread = [];
    for (const file of files) if (!readWand(JSON.parse(await readFile(new URL(`wands/${file}`, base), "utf8")))) unread.push(file);
    assert.deepEqual(unread, []);
    assert.deepEqual(readWand(await load("wands/pistol-wand")).riders, []);
    const shattering = readWand(await load("wands/wand-of-shattering-images"));
    // (Since batch 16 its shards are automated: a button for the image's destroyer.)
    assert.deepEqual([shattering.requires, shattering.riders.map(rider => rider.type)], [{ spells: ["Mirror Image"] }, ["image-shards"]]);
    assert.deepEqual(readWand(await load("wands/wand-of-continuation-1st-rank-spell")).riders, [{ type: "duration-scale", factor: 1.5 }]);
});
