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


// Rank 4, batch 42 (2026-10-02): Soothing Spring (the food route's card for a pool: one soak for each of its 16 places, each the item's healing at the
// cast rank, then Fatigued removed; the pool's size, capacity and structure, and fatigue's underlying source, are notes).

test("Soothing Spring: the pool's soak card", async () => {
    const plan = compile(await spell("rank-4/soothing-spring"));
    assert.equal(plan.resolution.kind, 'healing');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const food = plan.resolution.healing.food;
    assert.equal(plan.resolution.healing.recipient, 'consumer');
    assert.equal(food.verb, 'soak');
    assert.deepEqual(food.removes, ['fatigued']);
    assert.equal(food.pieces.base, 16);
    assert.equal(food.notes.length, 5);
    // Healing other than the item's isn't read.
    const other = compile(withText(await spell("rank-4/soothing-spring"), html => html.replace('regains 10d8 Hit Points', 'regains 8d8 Hit Points')));
    assert.notEqual(other.resolution.healing?.food?.verb, 'soak');
});
