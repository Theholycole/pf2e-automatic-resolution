import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {readWand} from '../src/compiler/spellshape-readers.js';

// Spellshape batch 4 (2026-10-05): family B wands — conditions with their own durations and a save that ends one, a condition following the spell's,
// persistent damage on a condition the spell grants, a trait the affliction gains, a condition when the spell runs its course, damage as turns start.
const base = new URL('../.cache/pf2e-spellshape-fixtures/', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(`${path}.json`, base), 'utf8'));

test("Wand of Dazzling Rays: Blinded 1 round and Dazzled for the rank's rounds; a critical hit's Blinded as long, ended by a Fortitude save", async () => {
    const wand = readWand(await load("wands/wand-of-dazzling-rays-3rd-rank"));
    assert.deepEqual(wand.spell.name, "Holy Light");
    assert.deepEqual(wand.riders[0].list.map(entry => [entry.slug, entry.rounds]), [["blinded", 1], ["dazzled", "rank"]]);
    assert.deepEqual(wand.riders[1].degrees.criticalSuccess[0], { uuid: "Compendium.pf2e.conditionitems.Item.XgEqL1kFApUbl5Z2", slug: "blinded", value: null, rounds: "rank", endSave: { statistic: "fortitude" } });
});

test("Wand of Dumbfounding Doom: Stupefied 1 above the spell's Frightened, for the spell's duration", async () => {
    const wand = readWand(await load("wands/wand-of-dumbfounding-doom-3rd-rank"));
    assert.deepEqual(wand.riders, [{ type: "follow", slug: "frightened", add: { uuid: "Compendium.pf2e.conditionitems.Item.e1XGnhKNSQIm5IXg", slug: "stupefied" }, offset: 1, lasting: "spell" }]);
});

test("Wand of Tormented Slumber: persistent mental on the unconscious; the waking rules the GM's", async () => {
    const wand = readWand(await load("wands/wand-of-tormented-slumber"));
    assert.deepEqual(wand.riders[0], { type: "persistent", whenCondition: "unconscious", formula: "1d6", damageType: "mental" });
    assert.deepEqual(wand.riders.slice(1).map(rider => rider.type), ["note", "note", "note"]);
});

test("Wands of Pernicious Poison, Wearying Dance and Paralytic Shock: virulent; Fatigued after the minute; 1d12 electricity while held", async () => {
    assert.deepEqual(readWand(await load("wands/wand-of-pernicious-poison-1st-rank")).riders, [{ type: "trait", trait: "virulent" }]);
    // (The 6th-rank wand replaces the spell's damage and poison: since batch 14, its rules are the GM's notes.)
    assert.ok(readWand(await load("wands/wand-of-pernicious-poison-6th-rank")).riders.every(rider => rider.type === "note"));
    const dance = readWand(await load("wands/wand-of-wearying-dance"));
    assert.deepEqual([dance.riders[0].type, dance.riders[0].minRounds, dance.riders[0].list[0].slug], ["on-end", 10, "fatigued"]);
    assert.deepEqual(readWand(await load("wands/wand-of-paralytic-shock-3rd-rank")).riders, [{ type: "turn-damage", formula: "1d12", damageType: "electricity", whileSlugs: ["stunned", "paralyzed"] }]);
});
