import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 6 (2026-10-05): family E — the caster's (or an ally's) benefits as the spell is cast, Vampiric Spell's temporary Hit Points,
// Safeguard Spell's exemption.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, ...extra });

test("Vampiric Spell, Energy Ablation, Elemental Defense: temporary Hit Points; the chosen energy resistance; the element traits' resistance", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/vampiric-spell")).riders, [{ type: "drain-temp-hp", fraction: 0.5, rounds: 10 }]);
    const ablation = readSpellshapeFeat(await load("feats/energy-ablation"));
    assert.deepEqual([ablation.riders[0].choice.length, ablation.riders[0].value, ablation.riders[0].until], [8, "rank", "caster-next-turn-end"]);
    assert.equal(unmetRequirement(ablation.requires, facts({ damageTypes: ["bludgeoning"] })) !== null, true);
    const elemental = readSpellshapeFeat(await load("feats/elemental-defense"));
    assert.deepEqual(elemental.riders, [{ type: "self-resistance", fromTraits: true, value: "2rank", until: "caster-turn-start" }]);
    assert.equal(unmetRequirement(elemental.requires, facts({ traits: ["mental"] })), "it has none of the air, earth, fire, metal, water, wood traits");
});

test("Current Spell and Skeletal Extension: PF2e's Effects on the caster; a grave spell is a necromancer's focus spell", async () => {
    const current = readSpellshapeFeat(await load("feats/current-spell"));
    assert.deepEqual([current.requires, current.riders[0].uuid, current.riders[0].choiceFromTraits], [{ anyTraits: ["air", "water"] }, "Compendium.pf2e.feat-effects.Item.8HGz3rQCHNgdAqFC", true]);
    const skeletal = readSpellshapeFeat(await load("feats/skeletal-extension"));
    assert.equal(skeletal.riders[0].uuid, "Compendium.pf2e.feat-effects.Item.CM7kDXU9Mf06oT4A");
    assert.equal(unmetRequirement(skeletal.requires, facts({ traits: ["focus", "necromancer"] })), null);
    assert.equal(unmetRequirement(skeletal.requires, facts({ traits: ["necromancer", "cantrip"] })), "it isn't a grave spell");
});

test("Dualistic Synergy, Safeguard Spell, Familiar's Resolve, Gusting Spell, Defensive Coordination", async () => {
    const dualistic = readSpellshapeFeat(await load("feats/dualistic-synergy"));
    assert.deepEqual(dualistic.riders[0], { type: "tradition-benefit", arcane: { bonus: 1, higher: 2, fromRank: 7 }, primal: { tempHp: "rank", rounds: 1 }, both: "halcyon" });
    assert.equal(unmetRequirement(dualistic.requires, facts({ fromSlots: false })), "it isn't cast from a spell slot");
    assert.deepEqual(readSpellshapeFeat(await load("feats/safeguard-spell")).riders, [{ type: "self-exempt" }]);
    const resolve = readSpellshapeFeat(await load("feats/familiars-resolve")).riders[0];
    assert.deepEqual([resolve.within, resolve.rounds, resolve.rules[0].predicate, resolve.byLevel], [30, 1, [{ or: ["inflicts:doomed", "inflicts:frightened"] }], { level: 14, value: 3 }]);
    assert.equal(readSpellshapeFeat(await load("feats/gusting-spell")).riders[0].type, "table");
    assert.deepEqual(readSpellshapeFeat(await load("feats/defensive-coordination")).requires, { spells: ["Rallying Anthem"] });
});
