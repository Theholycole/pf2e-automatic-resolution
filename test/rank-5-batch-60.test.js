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


// Rank 5, batch 60 (2026-10-02): Curse of Death (a sustained curse that ends when the spell ends; every degree's day of immunity; a success's stage 1 that
// can't increase; the stages' rank-counted damage written for the handler at the cast's rank).

test("Curse of Death: whole-cast immunity, a capped stage and rank-counted stage damage", async () => {
    const { isAfflictionHandoffPlan } = await import("../scripts/basic-save-core.js");
    const { resolveRankCount } = await import("../scripts/basic-save-runtime.js");
    const plan = compile(await spell("rank-5/curse-of-death"));
    assert.equal(supported(plan), true);
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(degree => outcomes[degree].afflictionImmunity?.duration), Array(4).fill({ value: 1, unit: "days" }));
    assert.deepEqual([outcomes.success.affliction.stage, outcomes.success.affliction.maxStage, outcomes.failure.affliction.stage, outcomes.criticalFailure.affliction.stage], [1, 1, 1, 2]);
    assert.equal(outcomes.criticalSuccess.affliction, undefined);
    const damage = plan.resolution.afflictionHandoff.rankDamage;
    assert.deepEqual(Object.keys(damage), ["1", "2", "3"]);
    assert.deepEqual([5, 6, 9].map(rank => [1, 2, 3].map(stage => resolveRankCount(damage[stage].count, rank))), [[4, 8, 12], [5, 9, 13], [8, 12, 16]]);
    assert.throws(() => resolveRankCount("(@item.rank; alert(1))", 5));
    const tampered = structuredClone(plan); tampered.resolution.outcomes.success.affliction.maxStage = 9;
    assert.equal(isAfflictionHandoffPlan(tampered), false);
    // An immunity to something else, or a cap past the stages, isn't read.
    const other = compile(withText(await spell("rank-5/curse-of-death"), html => html.replace("all <em>curses of death</em>", "all hexes")));
    assert.ok(other.automation.pendingCapabilities.includes("affliction-handoff:affliction-immunity"));
    const deep = compile(withText(await spell("rank-5/curse-of-death"), html => html.replace("can't increase beyond stage 1", "can't increase beyond stage 7")));
    assert.ok(deep.automation.pendingCapabilities.includes("affliction-handoff:affliction-cap"));
});
