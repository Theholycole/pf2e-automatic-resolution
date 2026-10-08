import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 12 (2026-10-05): family C cards — a spellshape's own save card (a spell made from its numbers), the cards with a button (the summoned
// creature, the circle, the surge's centre, the undead to command), and Daunting Spell's rows on the spell's own save.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, attack: false, ...extra });

test("Heraldic Proclamation, Explosive Metamorphosis, Vexing Tempest, Kaleidoscopic Entreaty, Grasping Spirits Spell: their cards", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/heraldic-proclamation")).riders,
        [{ type: "ally-heal", within: 30, amount: "2rank" }, { type: "card", center: "caster", within: 30, who: "enemies", statistic: "will", damage: { formula: "2rank", type: "spirit" } }]);
    const metamorphosis = readSpellshapeFeat(await load("feats/explosive-metamorphosis"));
    assert.deepEqual([metamorphosis.requires, metamorphosis.riders[0].damage], [{ nonCantrip: true, anyTraits: ["morph", "polymorph"] }, { dice: 1, faces: 6, typeChoice: ["acid", "cold", "electricity", "fire"], preferSpellTrait: true }]);
    const vexing = readSpellshapeFeat(await load("feats/vexing-tempest")).riders[0];
    assert.deepEqual([vexing.center, vexing.within, vexing.outcomes.failure], ["familiar", 15, "The creature is pushed 10 feet."]);
    assert.match(vexing.outcomes.criticalFailure, /^The creature is pushed 10 feet and knocked @UUID\[[^\]]+\]\{Prone\}\.$/);
    const kaleidoscopic = readSpellshapeFeat(await load("feats/kaleidoscopic-entreaty"));
    assert.deepEqual([kaleidoscopic.requires, kaleidoscopic.riders[0].statistic, kaleidoscopic.riders[0].classToo, Object.keys(kaleidoscopic.riders[0].outcomes).length], [{ spells: ["Entreat Spirit"] }, "fortitude", true, 4]);
    const grasping = readSpellshapeFeat(await load("feats/grasping-spirits-spell"));
    assert.deepEqual([grasping.riders[1].center, grasping.riders[1].outcomes.failure], ["target", "The creature is pulled 30 feet toward you."]);
});

test("Explosive and Ostentatious Arrival, Secondary Detonation Array, Thundering Surge, Command Undead: the cards with a button", async () => {
    const explosive = readSpellshapeFeat(await load("feats/explosive-arrival")).riders[0];
    assert.deepEqual([explosive.feet, explosive.dice, explosive.faces, explosive.damageType, explosive.exceptCaster], [10, 1, 4, "fire", false]);
    const ostentatious = readSpellshapeFeat(await load("feats/ostentatious-arrival"));
    assert.deepEqual([ostentatious.requires, ostentatious.riders[0].typeFromTraits.water, ostentatious.riders[0].exceptCaster], [{ anyTraits: ["summon", "incarnate"], actions: [3] }, "bludgeoning", true]);
    const detonation = readSpellshapeFeat(await load("feats/secondary-detonation-array")).riders[0];
    assert.deepEqual([detonation.feet, detonation.statistic, detonation.damage], [5, "reflex", { dice: 1, faces: 6, type: "force", fromSpell: true }]);
    const surge = readSpellshapeFeat(await load("feats/thundering-surge")).riders[0];
    assert.deepEqual([surge.flatDC, surge.results.criticalSuccess.formula, surge.results.success.prone, surge.results.failure.center], [5, "2level", "criticalFailure", "caster"]);
    const command = readSpellshapeFeat(await load("feats/command-undead"));
    assert.deepEqual([command.requires, command.riders[0].levelGap, command.riders[0].statistic], [{ spells: ["Harm"], singleTarget: true, targetTraits: ["undead"] }, 3, "will"]);
});

test("Daunting Spell: rows on the spell's own save; Stupefied while frightened", async () => {
    const daunting = readSpellshapeFeat(await load("feats/daunting-spell"));
    const rows = daunting.riders.find(rider => rider.type === "conditions").degrees;
    assert.deepEqual([rows.success[0].value, rows.failure.map(entry => `${entry.slug}${entry.value}${entry.whileCondition ?? ""}`), rows.criticalFailure.map(entry => entry.value)], [1, ["frightened2", "stupefied1frightened"], [3, 2]]);
    assert.equal(unmetRequirement(daunting.requires, facts({ saveStatistic: null })), "it doesn't require a fortitude or reflex or will save");
});
