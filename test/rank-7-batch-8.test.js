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


// Rank 7, batch 8 (2026-10-03): Pollen Pods, Curse of the Spirit Orchestra.
import { isExecutableLingeringPlan as lingeringReady } from "../scripts/basic-save-core.js";

test("Pollen Pods: four bulbs on the minefield route, each a 15-foot Fortitude card with the rows' damage and conditions, for 12 hours", async () => {
    const plan = compile(await spell("rank-7/pollen-pods"));
    assert.equal(lingeringReady(plan), true);
    assert.deepEqual([plan.resolution.lingering.mines.count, plan.resolution.lingering.mines.emanation, plan.resolution.lingering.durationSeconds], [4, 15, 43200]);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => effect.slug).sort(), ["dazzled", "stupefied"]);
});

test("Curse of the Spirit Orchestra: each row the generated curse (four skills rolled twice; any skill check's critical success a success, failure a critical failure) for its time", async () => {
    const plan = compile(await spell("rank-7/curse-of-the-spirit-orchestra"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [success] = plan.resolution.outcomes.success.noteEffects, [failure] = plan.resolution.outcomes.failure.noteEffects, [critical] = plan.resolution.outcomes.criticalFailure.noteEffects;
    assert.deepEqual([success.duration.anchor, failure.duration.value, failure.duration.unit, critical.duration.mode], ["source-turn", 1, "hours", "unlimited"]);
    assert.deepEqual(failure.rules.map(rule => rule.key), ["RollTwice", "AdjustDegreeOfSuccess", "AdjustDegreeOfSuccess"]);
});
