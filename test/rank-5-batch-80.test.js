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


// Rank 5, batch 80 (2026-10-03): Wall of Flesh (the picked feature: the mouths' Strikes and the arms' saves at a turn's end beside the wall, the eyes' bonus;
// the sections' statistics and the mouths' dice by rank).

test("Wall of Flesh: the wall", async () => {
    const { fleshWallAt } = await import("../src/compiler/flesh-wall.js");
    const plan = compile(await spell("rank-5/wall-of-flesh"));
    assert.equal(plan.resolution.kind, "flesh-wall");
    const data = plan.resolution.fleshWall;
    assert.deepEqual([data.seconds, data.section.ac, data.section.hp], [60, 10, 75]);
    assert.deepEqual(Object.keys(data.features), ["mouths", "eyes", "arms"]);
    assert.deepEqual([data.features.arms.statistic, data.features.arms.failure.name, data.features.arms.criticalFailure.name], ["reflex", "Grabbed", "Restrained"]);
    assert.deepEqual([5, 7, 9].map(rank => [fleshWallAt(data, rank).formula, fleshWallAt(data, rank).hp]), [["2d6", 75], ["3d6", 85], ["4d6", 95]]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/wall-of-flesh"), html => html.replace("The wall sprouts hundreds of unblinking eyes.", "The wall sprouts hundreds of unblinking eyes. They glow.")));
    assert.notEqual(other.resolution.kind, "flesh-wall");
});
