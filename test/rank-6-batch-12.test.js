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


// Rank 6, batch 12 (2026-10-03): Boots on the Ground, Crusade (notes).

test("Boots on the Ground: the caster's note until daily preparations; the illusory troops' statistics are the GM's", async () => {
    const plan = compile(await spell("rank-6/boots-on-the-ground"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.note.recipient, plan.resolution.note.duration.value, plan.resolution.note.duration.unit], ["spell-note", "source", 1, "days"]);
});

test("Crusade: a 10-minute note on each target; the level tiers are the GM's", async () => {
    const plan = compile(await spell("rank-9/crusade"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.note.recipient, plan.resolution.note.duration.value, plan.resolution.note.rules ?? null], ["spell-note", "target", 10, null]);
});
