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


// Rank 4, batch 108 (2026-10-03): Vital Seed (the spell attack, a willing target automatic; the drain a compiled basic Fortitude save of the item's damage
// for the creatures in a 15-foot emanation from the target; Erupt heals twice the most damage any one took, vitality damage to an undead host).

test("Vital Seed: the drain and the eruption", async () => {
    const plan = compile(await spell("rank-4/vital-seed"));
    assert.equal(plan.resolution.kind, "seed-drain");
    const data = plan.resolution.seedDrain;
    assert.deepEqual([data.radius, data.statistic, data.formula, data.type, data.multiplier, data.undeadType], [15, "fortitude", "2d12", "void", 2, "vitality"]);
    assert.equal(supported(data.drainPlan), true);
    assert.equal(data.drainPlan.resolution.check.basic, true);
    // A different multiplier isn't read.
    const other = compile(withText(await spell("rank-4/vital-seed"), html => html.replace("equal to twice the damage", "equal to three times the damage")));
    assert.notEqual(other.resolution.kind, "seed-drain");
});
