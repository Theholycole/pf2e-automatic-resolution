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


// Rank 10, batch 4 (2026-10-05): feature group 9, part 1 — blast cards (blast-cards.js): Falling Stars, Planar Collision, Cataclysm, Vampiric Revelry,
// Metallic Meteorite Glyph.
import { inspectParts } from '../scripts/basic-save-core.js';
const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));

test("Falling Stars and Planar Collision: the text's pools with the rank and the picked type; the push from the centre; the ruined ground's 15 of the plane's type", async () => {
    const stars = compile(await spell("rank-9/falling-stars"));
    assert.deepEqual(inspectParts(stars.resolution.incarnate.phases), []);
    const sPhases = phasesOf(stars);
    assert.equal(sPhases.center.plan.resolution.sharedDamage.formula, "{(6 + 1 * (@item.rank - 9))d10[bludgeoning],(14 + 2 * (@item.rank - 9))d6[untyped]}");
    assert.deepEqual(sPhases.outer.plan.resolution.casterChoice.values, ["sonic", "fire", "cold", "electricity"]);
    const plane = compile(await spell("rank-10/planar-collision"));
    assert.deepEqual(inspectParts(plane.resolution.incarnate.phases), []);
    const pPhases = phasesOf(plane);
    assert.deepEqual([pPhases.collision.plan.resolution.outcomes.criticalFailure.forcedMovement.distance, pPhases.collision.plan.resolution.outcomes.failure.forcedMovement.direction], [50, "from-center"]);
    assert.deepEqual([pPhases.ground.formula, pPhases.ground.typeChoice, pPhases.ground.terrain], ["15", ["acid", "bludgeoning", "fire", "slashing", "cold", "piercing"], 2]);
});

test("Cataclysm: the pools for creatures on the ground, flying and swimming (the tsunami doubled)", async () => {
    const plan = compile(await spell("rank-10/cataclysm"));
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const phases = phasesOf(plan);
    assert.equal(phases.swimming.plan.resolution.sharedDamage.formula, "{3d10[acid],3d10[cold],3d10[electricity],(2*3d10)[bludgeoning],3d10[fire]}");
    assert.equal((phases.ground.plan.resolution.sharedDamage.formula.match(/\[bludgeoning\]/g) ?? []).length, 2);
});

test("Vampiric Revelry and Metallic Meteorite Glyph: the caster's temporary Hit Points from the damage (half, or all for two rounds), the allies' share; the glyphs' meteor", async () => {
    const revel = compile(await spell("rank-9/vampiric-revelry"));
    assert.deepEqual(inspectParts(revel.resolution.incarnate.phases), []);
    const rPhases = phasesOf(revel);
    assert.deepEqual([rPhases.three.plan.resolution.casterBenefit.fraction, rPhases.rounds.plan.resolution.casterBenefit.fraction, rPhases["three-share"].from, rPhases["rounds-jump"].within], [0.5, 1, "three", 60]);
    const glyph = compile(await spell("rank-8/metallic-meteorite-glyph"));
    const gPhases = phasesOf(glyph);
    assert.deepEqual([gPhases.three.count, gPhases.glyph.formula, gPhases.glyph.statistic, gPhases.glyph.seconds], [3, "6d12[bludgeoning]", "reflex", 60]);
});
