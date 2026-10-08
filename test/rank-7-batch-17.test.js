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


// Rank 7, batch 17 (2026-10-05): feature group 3, part 4 — Unbreaking Wave Barrier (the caster's following region, its Effect, row terrain, optional
// growth) and Shadow Raid (the target's choice of save, the caster's type, the shadows' area with the disbelief that halves it).
import { isExecutableLingeringPlan } from "../scripts/basic-save-core.js";

test("Unbreaking Wave Barrier: a region on the caster, PF2e's +1 AC Effect, pushes away, row terrain, expansion", async () => {
    const plan = compile(await spell("rank-7/unbreaking-wave-barrier"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.areaOnCaster, lingering.excludeCaster, lingering.initial, [...lingering.events].sort()], ["placed", true, true, true, ["enter", "round-start"]]);
    assert.deepEqual([lingering.rowTerrain.degrees, lingering.sustainGrowth.feet, lingering.sustainGrowth.optional], [["success", "failure", "criticalFailure"], 5, true]);
    assert.ok(/Unbreaking Wave Barrier/.test(lingering.casterEffect.uuid));
    assert.deepEqual(["failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].forcedMovement.distance, plan.resolution.outcomes[d].forcedMovement.direction]), [[10, "away"], [20, "away"]]);
    assert.ok(plan.resolution.forcedMovementNotes.some(note => /solid barrier/.test(note)));
});

test("Shadow Raid: enemies' basic save (Reflex or Will), the caster's type, the shadows' area after Finalize", async () => {
    const plan = compile(await spell("rank-7/shadow-raid"));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.sharedDamage.formula, plan.resolution.casterChoice.values, plan.resolution.check.saveChoice.statistics],
        ["(6+2*min(1,floor(@item.rank/9)))d8[untyped]", ["bludgeoning", "piercing", "slashing"], ["reflex", "will"]]);
    const terrain = plan.resolution.areaTerrain;
    assert.deepEqual([terrain.noTerrain, terrain.durationSeconds, terrain.hazard.formula, terrain.hazard.enemiesOnly, terrain.disbelief.halves], [true, 60, "(3+1*min(1,floor(@item.rank/9)))d8", true, true]);
    // (A shadows' area the text doesn't state is refused.)
    const forged = structuredClone(plan); forged.resolution.areaTerrain.hazard.enemiesOnly = false;
    assert.equal(inspectSavePlan(forged).supported, false);
});
