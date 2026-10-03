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


// Rank 5, batch 57 (2026-10-02): Etheric Shards (a placed burst of difficult terrain, on the ground and in the air, for the minute; the GM's control when a
// creature ends a move action through it opens its basic Reflex save for 1d4 piercing (+1 every 2 ranks) per square traversed; PF2e widens the area).

test("Etheric Shards: the move's save by squares", async () => {
    const { isExecutableLingeringPlan, moveSaveExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/etheric-shards"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.events, lingering.terrain.movement, lingering.moveSave.die, lingering.moveSave.heightening], ["placed", [], ["walk", "fly"], 4, { interval: 2, increase: 1 }]);
    assert.equal(moveSaveExposurePlan(plan, 3, 5).resolution.sharedDamage.formula, "(3d4)[piercing]");
    const seventh = moveSaveExposurePlan(plan, 3, 7);
    assert.equal(seventh.resolution.sharedDamage.formula, "(3d4+3)[piercing]");
    assert.deepEqual(inspectSavePlan(seventh).blockers ?? [], []);
    assert.equal(moveSaveExposurePlan(plan, 0, 5), null);
    const other = compile(withText(await spell("rank-5/etheric-shards"), html => html.replace("per square traversed", "per round")));
    assert.equal(other.compilerEvidence.shardField, undefined);
});
