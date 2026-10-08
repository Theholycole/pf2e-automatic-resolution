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


// Rank 9, batch 13 (2026-10-05): the user's answers — Cataclysm's resistances 10 lower (applied by the save card), Monstrosity Form's extra die at 9th
// for its own abilities.
import { inspectIncarnatePlan } from '../scripts/basic-save-core.js';

test("Cataclysm: each part's save carries the resistances' reduction; the GM note is gone", async () => {
    const plan = compile(await spell("rank-10/cataclysm"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    for (const phase of plan.resolution.incarnate.phases) assert.equal(phase.plan.resolution.resistanceLower, 10, phase.key);
    assert.ok(!plan.resolution.incarnate.notes.some(note => /resistances/.test(note)));
});

test("Monstrosity Form: Heightened (9th)'s extra die on the shroud and Spine Rake", async () => {
    const plan = compile(await spell("rank-8/monstrosity-form"));
    const text = JSON.stringify(plan);
    assert.ok(text.includes('"minRank":9,"formula":"3d6"'), "the shroud's 3d6 at 9th");
    assert.ok(text.includes('5d8+10'), "Spine Rake's 5d8+10 at 9th");
});
