import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 3 (2026-10-05): family C riders on the save card — persistent and splash damage, a Focus Point for more damage, choose-one Effects, Chaotic Spell's d6.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));

test("Burning and Detonating Spell: persistent fire and splash, both by rank, on a damaged creature", async () => {
    const burning = readSpellshapeFeat(await load("feats/burning-spell"));
    assert.deepEqual(burning.riders, [{ type: "persistent", when: "damaged", formula: "rank", damageType: "fire", unlessPersistent: true }]);
    assert.equal(unmetRequirement(burning.requires, { cantrip: true, damageTypes: ["acid"], singleTarget: true, traits: [] }) !== null, true);
    const detonating = readSpellshapeFeat(await load("feats/detonating-spell"));
    assert.deepEqual(detonating.riders, [{ type: "splash", when: "damaged", formula: "rank" }]);
});

test("Consecrate Spell: an undead target; a Focus Point spent for spirit or vitality damage by rank", async () => {
    const consecrate = readSpellshapeFeat(await load("feats/consecrate-spell"));
    assert.deepEqual(consecrate.requires, { singleTarget: true, targetTraits: ["undead"] });
    assert.deepEqual(consecrate.riders.map(rider => rider.type), ["focus-spend", "extra-damage"]);
    assert.deepEqual([consecrate.riders[1].formula, consecrate.riders[1].damageTypeChoice, consecrate.riders[1].needsFocus], ["focus-rank", ["spirit", "vitality"], true]);
});

test("Marked for Rebuke and Forcible Energy: one damaged creature chosen; a generated weakness with a day's immunity; PF2e's Effect with the spell's type", async () => {
    const rebuke = readSpellshapeFeat(await load("feats/marked-for-rebuke"));
    assert.deepEqual([rebuke.riders[0].type, rebuke.riders[0].generated.rules[0].value, rebuke.riders[0].until, rebuke.riders[0].immunityHours], ["choose-one", 10, "caster-next-turn-end", 24]);
    const forcible = readSpellshapeFeat(await load("feats/forcible-energy"));
    assert.deepEqual([forcible.riders[0].uuid, forcible.riders[0].typeFromSpell, forcible.riders[0].unlessResists], ["Compendium.pf2e.feat-effects.Item.0Ai0u9kNJrEudPnN", true, true]);
    assert.deepEqual(forcible.requires.damageTypesAny, ["acid", "cold", "electricity", "fire", "sonic"]);
});

test("Chaotic Spell: a d6 picks the damage type and its rider", async () => {
    const chaotic = readSpellshapeFeat(await load("feats/chaotic-spell"));
    const rider = chaotic.riders[0];
    assert.deepEqual([rider.type, rider.die], ["chaotic", 6]);
    assert.deepEqual([rider.results[1].damageType, rider.results[1].riders[0].list[0].slug], ["acid", "sickened"]);
    assert.deepEqual([rider.results[2].damageType, rider.results[2].riders[0].rules[0].selector], ["cold", "all-speeds"]);
    assert.equal(rider.results[3].riders[0].list[0].slug, "off-guard");
});
