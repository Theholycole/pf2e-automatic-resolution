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


// Rank 4, batch 135 (2026-10-03): Infiltrator's Tunnel (the portals' crossing save for others; designated creatures from 6th).

test("Infiltrator's Tunnel: the portals", async () => {
    const plan = compile(await spell("rank-4/infiltrators-tunnel"));
    assert.equal(plan.resolution.kind, "portal-pair");
    const data = plan.resolution.portalPair;
    assert.deepEqual([data.seconds, data.statistic, data.teleportFeet, data.designate], [60, "will", 30, { rank: 6, count: 5 }]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-4/infiltrators-tunnel"), html => html.replace("as though they were adjacent to each other.", "as though they were adjacent to each other and become invisible.")));
    assert.notEqual(other.resolution.kind, "portal-pair");
});
