import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 7, batch 18 (2026-10-05): feature group 5, part 2 — Corrosive Body and One with the Land (form-riders.js: the card's retaliation, temporary
// Hit Points, spell-attack Strike, terrain and damage parts).

test("Corrosive Body: PF2e's Effect proves the unarmed and spell dice and the immunity; the touch's acid by rank, the temporary Hit Points by rank, once a round, ending with the spell", async () => {
    const plan = compile(await spell("rank-7/corrosive-body"));
    assert.equal(plan.resolution.kind, "effect");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const parts = plan.resolution.controls.parts;
    const touch = parts.find(part => part.key === "corrode"), digest = parts.find(part => part.key === "digest");
    assert.deepEqual([touch.kind, touch.formula, touch.byRank, touch.tempHp], ["retaliate", "3d6[acid]", [{ minRank: 9, formula: "4d6[acid]" }], { formula: "3d6", byRank: [{ minRank: 9, formula: "5d6" }] }]);
    assert.equal(digest.kind, "temp-hp");
    assert.equal(plan.resolution.formRiders.tempExpires, true);
    assert.ok(plan.resolution.gmNotes.some(note => /Acid Splash/.test(note) && /15 feet/.test(note)));
    // A heightened entry PF2e's Effect doesn't match isn't read.
    const changed = compile(withText(await spell("rank-7/corrosive-body"), html => html.replace("deal 2d4 additional acid damage, and you gain 5d6", "deal 3d4 additional acid damage, and you gain 5d6")));
    assert.equal(changed.resolution.formRiders, undefined);
});

test("One with the Land: PF2e's tremorsense; the terrain vengeance Strike (spell attack, 5d12 of the chosen type), the burst's difficult terrain, the expulsion's 10d6", async () => {
    const plan = compile(await spell("rank-9/one-with-the-land"));
    assert.equal(plan.resolution.kind, "effect");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const parts = Object.fromEntries(plan.resolution.controls.parts.map(part => [part.key, part]));
    assert.equal(parts.vengeance.kind, "attack");
    assert.equal(parts.vengeance.plan.resolution.check.statistic, "spell-attack");
    assert.deepEqual(parts.vengeance.plan.resolution.casterChoice.values, ["bludgeoning", "piercing", "slashing"]);
    assert.deepEqual([parts.terrain.kind, parts.terrain.place, parts.terrain.difficulty], ["terrain", { type: "burst", value: 20 }, 2]);
    assert.deepEqual([parts.expelled.kind, parts.expelled.formula], ["damage", "10d6"]);
    assert.ok(plan.resolution.gmNotes.some(note => /cover/.test(note)) && plan.resolution.gmNotes.some(note => /temperature/.test(note)));
});
