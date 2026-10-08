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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 9, batch 3 (2026-10-03): Unblinking Flame Ignition.

test("Unblinking Flame Ignition: PF2e's Effect proved (senses, fly Speed, Quickened) and a 5-foot aura dealing 1d12 fire to others as their turns start", async () => {
    const plan = compile(await spell("rank-9/unblinking-flame-ignition"));
    const data = plan.resolution.auraTurnEffect;
    assert.deepEqual([plan.resolution.kind, data.ignition, data.area.value, data.damage.formula, data.damage.excludeCaster, data.durationSeconds], ["aura-turn-effect", true, 5, "1d12[fire]", true, 18]);
    assert.match(data.notes[0], /Strike or Fly/);
});
