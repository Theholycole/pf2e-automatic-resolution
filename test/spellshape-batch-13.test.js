import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 13 (2026-10-05): the last feats — every one of PF2e's 131 spellshape feats read.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Dousing, Shadow, Sinbladed Spell: persistent acid or fire at DC 10; a creature's ±2; bleed on a hit or a failed save", async () => {
    const dousing = readSpellshapeFeat(await load("feats/dousing-spell"));
    assert.deepEqual([dousing.requires, dousing.riders[0]], [{ singleTarget: true }, { type: "douse", types: ["acid", "fire"], dc: 10 }]);
    const shadow = readSpellshapeFeat(await load("feats/shadow-spell")).riders[0];
    assert.deepEqual([shadow.options.map(option => `${option.selector}${option.modifier}`), shadow.rounds, shadow.enemiesIfHitOrFailed], [["stealth2", "perception-2"], 1, true]);
    const sinbladed = readSpellshapeFeat(await load("feats/sinbladed-spell"));
    // (Every spell cast with it is valid: the user's decision, 2026-10-05.)
    assert.deepEqual([sinbladed.requires, sinbladed.riders[0]], [{ table: ["a non-cantrip sin or curriculum spell that affects a single target"] }, { type: "persistent", when: "hit-or-failed", formula: "rank", damageType: "bleed" }]);
    assert.equal(unmetRequirement(sinbladed.requires, facts({ cantrip: true, traits: ["fire"] })), null);
});

test("Shared Sight, Spell Shroud, Vigorous Anthem, Coven Spell, Apparition's Reflection", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/shared-sight")).riders, [{ type: "allies-sense", sense: "spiritsense", rounds: 10 }]);
    assert.deepEqual(readSpellshapeFeat(await load("feats/spell-shroud")).riders[0].within, 15);
    const anthem = readSpellshapeFeat(await load("feats/vigorous-anthem"));
    assert.deepEqual([anthem.requires, anthem.riders[0].type, Boolean(anthem.riders[0].uuid)], [{ spells: ["Courageous Anthem"] }, "allies-effect", true]);
    const coven = readSpellshapeFeat(await load("feats/coven-spell"));
    assert.deepEqual([coven.riders[0].type, coven.riders[0].uuid], ["coven", "Compendium.pf2e.feat-effects.Item.JRaFM5Ic4xR8WGgs"]);
    assert.equal(readSpellshapeFeat(await load("feats/apparitions-reflection")).riders.find(rider => rider.type === "self-conditions").list[0].slug, "confused");
});

test("Every spellshape feat is read; Energy Fusion's energy requirement", async () => {
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(new URL("feats/", base));
    const unread = [];
    for (const file of files) if (!readSpellshapeFeat(JSON.parse(await readFile(new URL(`feats/${file}`, base), "utf8")))) unread.push(file);
    assert.deepEqual(unread, []);
    const fusion = readSpellshapeFeat(await load("feats/energy-fusion"));
    assert.equal(unmetRequirement(fusion.requires, facts({ damageTypes: ["slashing"] })), "it deals no acid, cold, electricity, fire, force, sonic, vitality, void damage");
});
