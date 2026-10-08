import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readSpellshapeFeat, readWand, unmetRequirement} from '../src/compiler/spellshape-readers.js';
import {grownArea} from '../scripts/spellshape-runtime.js';

// Spellshape batch 5 (2026-10-05): family A — the area grown, the range and origin (the table's), a thrall destroyed, Prone on a hit; wands for any spell.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));
const facts = extra => ({ name: "X", cantrip: false, damageTypes: [], area: null, hasDuration: false, saveStatistic: null, singleTarget: false, traits: [], range: "", targeted: false, rank: 1, actions: 2, ...extra });

test("Widen and Growth Spell: the area rules read; a burst under 10 feet isn't widened; Growth's line 120 → 135", async () => {
    const widen = readSpellshapeFeat(await load("feats/widen-spell"));
    assert.deepEqual(widen.requires, { area: true, areaTypes: ["burst", "cone", "line"], noDuration: true });
    const grow = widen.riders[0].grow;
    assert.deepEqual([grownArea({ type: "burst", value: 20 }, grow).value, grownArea({ type: "burst", value: 5 }, grow).value, grownArea({ type: "cone", value: 15 }, grow).value, grownArea({ type: "line", value: 60 }, grow).value], [25, 5, 20, 70]);
    const growth = readSpellshapeFeat(await load("feats/growth-spell"));
    assert.equal(grownArea({ type: "line", value: 120 }, growth.riders[0].grow).value, 135);
    assert.equal(unmetRequirement(growth.requires, facts({ cantrip: true, area: { type: "burst", value: 10 } })), "a cantrip");
});

test("Spiritual Expansion Spell: an emanation with a duration qualifies too", async () => {
    const feat = readSpellshapeFeat(await load("feats/spiritual-expansion-spell"));
    assert.equal(unmetRequirement(feat.requires, facts({ area: { type: "emanation", value: 10 }, hasDuration: true })), null);
    assert.equal(unmetRequirement(feat.requires, facts({ area: { type: "burst", value: 10 }, hasDuration: true })), "it has a duration");
    assert.equal(grownArea({ type: "emanation", value: 10 }, feat.riders[0].grow, { hasDuration: true }).value, 15);
});

test("Reach Spell, the Conduits, Seneschal Spell, In Tune: the range and origin, the table's; Reach of the Dead's thrall; Touch Focus's Prone on a hit", async () => {
    assert.deepEqual(readSpellshapeFeat(await load("feats/reach-spell")).riders, [{ type: "range", add: 30, touch: 30 }]);
    assert.equal(unmetRequirement(readSpellshapeFeat(await load("feats/reach-spell")).requires, facts({ range: "" })), "it has no range");
    for (const slug of ["familiar-conduit", "natural-conduit", "seneschal-spell", "in-tune"]) assert.ok(readSpellshapeFeat(await load(`feats/${slug}`)).riders.every(rider => rider.type === "table"), slug);
    assert.deepEqual(readSpellshapeFeat(await load("feats/reach-of-the-dead")).riders, [{ type: "thrall-origin", feet: 60, destroy: true }]);
    const touch = readSpellshapeFeat(await load("feats/touch-focus"));
    assert.deepEqual(touch.requires, { targeted: true, beyondTouch: true });
    assert.deepEqual(touch.riders.at(-1), { type: "conditions", when: "hit", list: [{ uuid: "Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60", slug: "prone", value: null }] });
});

test("Wands of Widening and Reaching: any spell of the wand's rank, with the Craft Requirements' limits", async () => {
    const widening = readWand(await load("wands/wand-of-widening-1st-rank-spell"));
    assert.deepEqual(widening.requires, { actions: [1, 2], noDuration: true, area: true, areaTypes: ["burst", "cone", "line"], rank: 1 });
    assert.equal(unmetRequirement(widening.requires, facts({ rank: 3, area: { type: "burst", value: 20 } })), "it isn't cast at rank 1");
    const reaching = readWand(await load("wands/wand-of-reaching-1st-rank"));
    assert.deepEqual([reaching.spell, reaching.requires, reaching.riders], [null, { actions: [1, 2], ranged: true, rank: 1 }, [{ type: "range", add: 30, touch: 30 }]]);
    assert.equal(unmetRequirement(reaching.requires, facts({ range: "30 feet", actions: 3 })), "it doesn't take 1 or 2 actions");
});
