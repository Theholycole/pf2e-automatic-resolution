import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, readWand, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 2 (2026-10-05): family B riders — damaged creatures, PF2e's linked Effects, named spells, marks, reductions, notes; wands' "…, but …".
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));

test("Cast Down and Overburdening Spell: the named spells; Prone when damaged; PF2e's linked Effects (critical failure, unless unaffected)", async () => {
    const castDown = readSpellshapeFeat(await load("feats/cast-down"));
    assert.deepEqual(castDown.requires, { spells: ["Harm", "Heal"], damaging: true, singleTarget: true });
    assert.deepEqual(castDown.riders.map(rider => [rider.type, rider.when ?? rider.degrees?.join?.(",") ?? null]), [["conditions", "damaged"], ["effect", "criticalFailure"]]);
    assert.equal(castDown.riders[1].uuid, "Compendium.pf2e.feat-effects.Item.Ve1CRFI8ikL6dqcL");
    assert.equal(unmetRequirement(castDown.requires, { name: "Fireball", damageTypes: ["fire"], singleTarget: false, traits: [] }), "it isn't Harm or Heal");
    const overburdening = readSpellshapeFeat(await load("feats/overburdening-spell"));
    assert.deepEqual([overburdening.riders[0].when, overburdening.riders[0].name], ["affected", "Effect: Overburdening Spell"]);
});

test("Portentous, Tender Ministrations and Branding Spell: Fascinated until the caster's turn; Frightened down by 1; the week's brand; the GM's parts", async () => {
    const portentous = readSpellshapeFeat(await load("feats/portentous-spell"));
    assert.deepEqual(portentous.riders.map(rider => rider.type), ["note", "conditions", "gm-effect"]);
    assert.equal(portentous.riders[1].list[0].until, "caster-turn-start");
    const tender = readSpellshapeFeat(await load("feats/tender-ministrations"));
    assert.deepEqual(tender.riders[0], { type: "reduce", slug: "frightened", by: 1 });
    const branding = readSpellshapeFeat(await load("feats/branding-spell"));
    assert.deepEqual([branding.requires.damageType, branding.riders[0].days, branding.riders[0].text.length], ["fire", 7, 3]);
});

test("Wands: Noisome Acid (damaged), Clinging Rime (persistent cold), Splintered Sorrows (the rank's rounds; a critical hit), Crackling Lightning", async () => {
    assert.equal(readWand(await load("wands/wand-of-noisome-acid-2nd-rank")).riders[0].when, "damaged");
    assert.equal(readWand(await load("wands/wand-of-clinging-rime-9th-rank")).riders[0].formula, "3d6");
    const sorrows = readWand(await load("wands/wand-of-splintered-sorrows-rank-4"));
    assert.deepEqual([sorrows.riders[0].list[0].rounds, sorrows.riders[1].degrees.criticalSuccess[0].slug], ["rank", "slowed"]);
    const crackling = readWand(await load("wands/wand-of-crackling-lightning-6th-rank-spell"));
    assert.deepEqual([crackling.riders[0], crackling.riders[1].degrees.failure[0].slug], [{ type: "area", lineWidth: 10 }, "off-guard"]);
});
