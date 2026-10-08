import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, readWand, readRequirements, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 1 (2026-10-05): the core — spellshape feats and wands read from their text into requirements and riders.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = overrides => ({ cantrip: false, damageTypes: ["fire"], area: { type: "burst", value: 20 }, hasDuration: false, saveStatistic: "reflex", singleTarget: false, traits: ["fire"], ...overrides });

test("Intimidating and Reverberating Spell: damage in an area; Frightened by degree; the extra sonic and Deafened (1 minute on a critical failure)", async () => {
    const intimidating = readSpellshapeFeat(await load("feats/intimidating-spell"));
    assert.deepEqual(intimidating.requires, { damaging: true, area: true });
    assert.deepEqual(intimidating.riders[0].degrees.criticalFailure.map(entry => [entry.slug, entry.value]), [["frightened", 2]]);
    const reverberating = readSpellshapeFeat(await load("feats/reverberating-spell"));
    assert.deepEqual(reverberating.requires, { nonCantrip: true, damaging: true, area: true });
    assert.deepEqual(reverberating.riders.map(rider => rider.type), ["extra-damage", "conditions"]);
    assert.equal(reverberating.riders[1].degrees.criticalFailure[0].rounds, 10);
});

test("Knockback, Thunderclap, Scintillating and Dizzying Spell: their requirements and riders", async () => {
    const knockback = readSpellshapeFeat(await load("feats/knockback-spell"));
    assert.deepEqual(knockback.requires.areaTypes, ["burst", "cone", "emanation", "line"]);
    assert.deepEqual(knockback.riders[0], { type: "push", degrees: { failure: 5, criticalFailure: 10 }, from: { cone: "caster", emanation: "caster", line: "caster", burst: "center" } });
    const thunderclap = readSpellshapeFeat(await load("feats/thunderclap-spell"));
    assert.equal(thunderclap.requires.traitOrDamage, "electricity");
    assert.deepEqual([thunderclap.riders[0].onlySave, thunderclap.riders[0].degrees.criticalFailure.map(entry => entry.slug)], ["reflex", ["deafened", "prone"]]);
    const scintillating = readSpellshapeFeat(await load("feats/scintillating-spell"));
    assert.deepEqual(scintillating.requires, { notTraits: ["darkness"], noDuration: true, saves: ["reflex"] });
    const dizzying = readSpellshapeFeat(await load("feats/dizzying-spell"));
    assert.deepEqual([dizzying.requires, dizzying.riders[0].degrees.failure[0].value, dizzying.riders[0].degrees.failure[0].rounds], [{ saves: ["will"], singleTarget: true }, 2, 1]);
});

test("Wand of Smoldering Fireballs: its spell and the persistent fire on a failed save, by the wand's rank", async () => {
    const wand = readWand(await load("wands/wand-of-smoldering-fireballs-5th-rank-spell"));
    assert.equal(wand.spell.name, "Fireball");
    assert.deepEqual(wand.riders, [{ type: "persistent", degrees: ["failure", "criticalFailure"], formula: "2d6", damageType: "fire" }]);
    // (A wand that only casts its spell — read since batch 14, with nothing to apply.)
    assert.deepEqual(readWand(await load("wands/magic-wand-3rd-rank-spell")).riders, []);
});

test("the requirements against the spell as cast", () => {
    const requires = readRequirements("a Spell that has an area of a burst, cone, emanation, or line; has no duration; and requires creatures to attempt a Reflex or Fortitude save");
    assert.equal(unmetRequirement(requires, facts()), null);
    assert.equal(unmetRequirement(requires, facts({ hasDuration: true })), "it has a duration");
    assert.equal(unmetRequirement(requires, facts({ saveStatistic: "will" })), "it doesn't require a reflex or fortitude save");
    assert.equal(unmetRequirement({ damaging: true }, facts({ damageTypes: [] })), "it deals no damage");
    // (Read since batch 13: "a Spell that summons a creature" is a spell with the summon trait.)
    assert.deepEqual(readRequirements("a Spell that summons a creature"), { anyTraits: ["summon"] });
    assert.equal(readRequirements("a Spell that bends the stars"), null);
});
