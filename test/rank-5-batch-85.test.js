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


// Rank 5, batch 85 (2026-10-03): Transmute Rock and Mud (the mud's terrain; the ceiling's basic save and the mud-to-rock save compiled plans; the cubes by rank).

test("Transmute Rock and Mud: the transmutation", async () => {
    const plan = compile(await spell("rank-5/transmute-rock-and-mud"));
    assert.equal(plan.resolution.kind, "rock-mud");
    const data = plan.resolution.rockMud;
    assert.deepEqual([data.cubes.count, data.cubes.feet, data.mud.deepFeet, data.mud.swimDC, data.mud.ceiling.dice, data.mud.ceiling.spread], [2, 10, 3, 10, 8, 10]);
    assert.equal(data.ceilingPlan.resolution.sharedDamage.formula, "8d6[bludgeoning]");
    assert.ok(supported(data.ceilingPlan));
    assert.ok(supported(data.rockPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/transmute-rock-and-mud"), html => html.replace("Mud in the area turns into unworked stone.", "Mud in the area turns into unworked stone and glows.")));
    assert.notEqual(other.resolution.kind, "rock-mud");
});
