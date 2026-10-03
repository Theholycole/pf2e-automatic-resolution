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


// Rank 4, batch 48 (2026-10-02): Grasping Earth (a sustained burst: a save when cast and at the end of a turn inside — Grabbed / Restrained until it
// Escapes; the first Sustain each round deals the grabbed 1d6 and the restrained 2d6 bludgeoning, +1d6 / +2d6 every 2 ranks).

test("Grasping Earth: the held creatures' Sustain damage", async () => {
    const { heldDamageFormula } = await import("../src/compiler/held-damage.js");
    const plan = compile(await spell("rank-4/grasping-earth"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.sustained, lingering.skipWhile], [true, ["turn-end"], true, undefined]);
    assert.deepEqual(lingering.heldDamage.entries.map(entry => [entry.slug, heldDamageFormula(entry, 6, lingering.heldDamage.baseRank)]), [["grabbed", "2d6[bludgeoning]"], ["restrained", "4d6[bludgeoning]"]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => (plan.resolution.outcomes[d].effects ?? []).map(e => e.slug)), [[], ["grabbed"], ["restrained"]]);
    // Another step isn't read.
    const other = compile(withText(await spell("rank-4/grasping-earth"), html => html.replace("1d6 for grabbed creatures", "1d8 for grabbed creatures")));
    assert.equal(other.compilerEvidence.heldDamage, undefined);
});
