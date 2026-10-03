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


// Rank 5, batch 83 (2026-10-03): Soulshelter Vessel (the pool per Bulk; the transfer; the rescue at 0 HP; the Bulk, transfer and rescue by rank).

test("Soulshelter Vessel: the vessel", async () => {
    const { soulVesselAt } = await import("../src/compiler/soul-vessel.js");
    const plan = compile(await spell("rank-5/soulshelter-vessel"));
    assert.equal(plan.resolution.kind, "soul-vessel");
    const data = plan.resolution.soulVessel;
    assert.deepEqual([data.seconds, data.bulk, data.perBulk, data.transfer, data.rescue, data.distance], [600, { min: 1, max: 2 }, 40, 10, 20, 500]);
    assert.deepEqual(soulVesselAt(data, 7, 5), { maxBulk: 3, transfer: 15, rescue: 30 });
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/soulshelter-vessel"), html => html.replace("When the pool is empty, the object becomes broken.", "When the pool is empty, the object explodes.")));
    assert.notEqual(other.resolution.kind, "soul-vessel");
});
