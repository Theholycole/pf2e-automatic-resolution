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


// Rank 7, batch 15 (2026-10-05): conjured tokens and copies (feature group 2b) — Dragon Turret, Duplicate Foe, Reanimate Foe, Lifewood Cage, Elemental Confluence.
import { inspectIncarnatePlan } from "../scripts/basic-save-core.js";

test("Dragon Turret: the dragon's token statistics and its breath, typed by the casting tradition, each Cast or Sustain", async () => {
    const plan = compile(await spell("rank-10/dragon-turret"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const { conjure, phases: [breath] } = plan.resolution.incarnate;
    assert.deepEqual([conjure.ac, conjure.saves, conjure.hp, conjure.size, conjure.endsAtZero, conjure.sustained, conjure.immunities.includes("prone")], [40, 30, 250, "grg", true, true, true]);
    assert.deepEqual(breath.typeByTradition, { arcane: "force", divine: "spirit", occult: "mental", primal: "fire" });
    assert.equal(breath.plan.resolution.sharedDamage.formula, "13d8[untyped]");
    assert.ok(breath.repeat);
});

test("Duplicate Foe: the save rows that make a copy (70 HP, +10 a rank; half damage and 2 rounds on a success), the level limit at the cast rank", async () => {
    const plan = compile(await spell("rank-7/duplicate-foe"));
    assert.ok(supported(plan));
    const { byDegree, hp, hpLoss } = plan.resolution.duplicate;
    assert.deepEqual([byDegree.success, byDegree.failure, hp.base, hp.step, hpLoss], [{ halfDamage: true, maxRounds: 2 }, {}, 70, 10, "4d6"]);
    const limit = plan.targeting.actorConstraints.predicates.find(predicate => predicate.kind === "level-at-most");
    assert.deepEqual([limit.level, limit.byRank["8"], limit.byRank["10"]], [15, 17, 21]);
});

test("Reanimate Foe: the Undead Lore check against the corpse's level DC; 100 HP losing 15 (half damage and 50 on a failure); a thrall on a critical failure", async () => {
    const plan = compile(await spell("rank-9/reanimate-foe"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [check, thrall] = plan.resolution.incarnate.phases;
    assert.deepEqual([check.kind, check.skill, check.results.success.hp, check.results.success.hpLoss, check.results.failure.hpLoss, check.results.failure.halfDamage, check.results.criticalFailure.thrall],
        ["check-copy", "undead-lore", 100, "15", "50", true, true]);
    assert.equal(thrall.kind, "destroy-thrall");
});

test("Lifewood Cage and Elemental Confluence: the conjured token's statistics and what it does", async () => {
    const cage = compile(await spell("rank-7/lifewood-cage"));
    assert.deepEqual(inspectIncarnatePlan(cage), []);
    assert.deepEqual([cage.resolution.incarnate.conjure.ac, cage.resolution.incarnate.conjure.hp, cage.resolution.incarnate.conjure.resistances], [10, 40, [{ type: "all-damage", value: 20 }]]);
    assert.deepEqual(cage.resolution.incarnate.phases[0].plan.resolution.outcomes.failure.noteEffects.map(note => note.label), ["Trapped in the cage"]);
    const confluence = compile(await spell("rank-6/elemental-confluence"));
    assert.deepEqual(inspectIncarnatePlan(confluence), []);
    assert.deepEqual(confluence.resolution.incarnate.conjure.concealing.radius, 10);
    assert.deepEqual(confluence.resolution.incarnate.phases.map(part => `${part.key}:${part.kind}`), ["air:save", "earth:effect", "fire:damage", "metal:save", "water:attack", "wood:terrain"]);
    assert.equal(confluence.resolution.incarnate.phases.find(part => part.key === "earth").onConjured, true);
});
