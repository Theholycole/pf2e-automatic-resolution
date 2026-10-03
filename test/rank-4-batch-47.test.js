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


// Rank 4, batch 47 (2026-10-02): Living Terrain (a sustained moving burst: when cast and on the first Sustain each turn, the creatures it covers or
// passes over take 4d6 bludgeoning (+1d6 a rank) by their Reflex save — Clumsy 1 / Prone and Clumsy 1 / Prone and Clumsy 2 until the start of the
// caster's next turn; moving it is the GM's, with the passed-over creatures in the review).

test("Living Terrain: the moving area's rows", async () => {
    const plan = compile(await spell("rank-4/living-terrain"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.sustained], [true, ["sustain"], true]);
    const rows = Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([d, o]) => [d, (o.effects ?? []).map(e => `${e.slug}${e.value ? ` ${e.value}` : ""}`)]));
    assert.deepEqual(rows, { criticalSuccess: [], success: ["clumsy 1"], failure: ["prone", "clumsy 1"], criticalFailure: ["prone", "clumsy 2"] });
    assert.equal(plan.resolution.outcomes.success.effects[0].duration.anchor, "source-turn");
    assert.ok(lingering.notes.some(note => /up to 15 feet in a straight line/.test(note)));
    // Another movement rule isn't read.
    const other = compile(withText(await spell("rank-4/living-terrain"), html => html.replace("in a straight line along the ground", "in any direction")));
    assert.equal(other.compilerEvidence.movingTerrain, undefined);
});
