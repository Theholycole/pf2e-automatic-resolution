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


import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// Rank 7, batch 3 (2026-10-03): Hungry Depths, Mask of Terror.

test("Hungry Depths: a placed burst saved against when cast; those it moves through the GM's control", async () => {
    const plan = compile(await spell("rank-7/hungry-depths"));
    assert.ok(isExecutableLingeringPlan(plan));
    const { lingering } = plan.resolution;
    assert.deepEqual([lingering.events, lingering.initial, lingering.oncePerRound, lingering.moveOnSustain, lingering.gmAction.actions], [[], true, true, true, ["vortex"]]);
});

test("Mask of Terror: the masked creatures' Effect; the acting creature's Will save, immune until the end of its next turn", async () => {
    const plan = compile(await spell("rank-7/mask-of-terror"));
    assert.equal(plan.resolution.kind, "repeat-save");
    assert.deepEqual(plan.resolution.repeatSave.onTargets, { count: 1, step: { rank: 8, count: 5 } });
    const action = plan.resolution.grantedActions[0].plan;
    assert.ok(supported(action));
    assert.deepEqual(action.resolution.temporaryImmunity.duration, { value: 1, unit: "rounds", expiry: "turn-end" });
    assert.deepEqual(action.resolution.outcomes.criticalFailure.rowNotes.map(note => note.kind), ["action-wasted"]);
});
