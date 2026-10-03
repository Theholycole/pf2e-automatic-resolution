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


// Rank 3, batch 56 (2026-10-02): Burning Trail (a damaging area placed later: the trail the target leaves on its first Stride, which the GM
// places from the cast's card for the rest of the minute; entering it is the GM's control and a creature in it as its turn starts takes it
// automatically; 2d10 fire, +1d10 every 2 ranks).

test("Burning Trail: the trail placed later", async () => {
    const { damagingWallAt } = await import("../src/compiler/damaging-wall.js");
    const plan = compile(await spell("rank-3/burning-trail"));
    assert.equal(plan.resolution.kind, "damaging-wall");
    const wall = plan.resolution.damagingWall;
    assert.equal(wall.deferred.noun, "trail");
    assert.deepEqual([wall.control.trigger, wall.control.turnStart, wall.durationSeconds], ["entered the trail", true, 60]);
    assert.deepEqual([3, 4, 5, 7].map(rank => damagingWallAt(wall, rank).formula), ["2d10", "2d10", "3d10", "4d10"]);
    assert.equal(wall.notes.length, 2);
    // Another target isn't read; nor a trail without the Stride.
    const other = structuredClone(await spell("rank-3/burning-trail")); other.system.target.value = "all allies";
    assert.notEqual(compile(other).resolution.kind, "damaging-wall");
    assert.notEqual(compile(withText(await spell("rank-3/burning-trail"), html => html.replace("The first time the target Strides", "Each time the target Strides"))).resolution.kind, "damaging-wall");
});
