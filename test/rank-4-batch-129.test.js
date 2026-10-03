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


// Rank 4, batch 129 (2026-10-03): Replicate (the target, its level at most 8 +2 a rank, copied as the caster's minion with a quarter of its Hit Points while
// sustained; 0 HP ends the spell).

test("Replicate: the illusory double", async () => {
    const plan = compile(await spell("rank-4/replicate"));
    assert.equal(plan.resolution.kind, "replica");
    const data = plan.resolution.replica;
    assert.deepEqual([data.hpFraction, data.seconds], [0.25, 600]);
    const { replicaMaxLevel } = await import("../src/compiler/replica.js");
    assert.deepEqual([4, 5, 7].map(rank => replicaMaxLevel(data, rank, 4)), [8, 10, 14]);
    assert.equal(data.notes.length, 6);
    // A different share of Hit Points isn't read unless stated.
    const other = compile(withText(await spell("rank-4/replicate"), html => html.replace("one quarter of the original's Hit Points", "all of the original's Hit Points")));
    assert.notEqual(other.resolution.kind, "replica");
});
