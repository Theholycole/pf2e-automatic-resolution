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


// Rank 4, batch 89 (2026-10-02): Fallow Field (a sustained placed burst; a creature inside that would regain Hit Points has the healing held, its Will save
// rolled, and the result's share restored — all, all, half or none; a critical success makes it immune for the minute).

test("Fallow Field: the held healing's save", async () => {
    const { isExecutableLingeringPlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/fallow-field"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.sustained, lingering.events, lingering.area], ["placed", true, [], { type: "burst", value: 15 }]);
    assert.deepEqual(lingering.healingSave, { statistic: "will", shares: { criticalSuccess: 1, success: 1, failure: 0.5, criticalFailure: 0 }, immunity: { degree: "criticalSuccess", value: 1, unit: "minutes" } });
    // Another share is refused.
    const bad = structuredClone(plan); bad.resolution.lingering.healingSave.shares.failure = 0.25;
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-4/fallow-field"), html => html.replace("only half the number", "only a quarter of the number")));
    assert.equal(other.compilerEvidence.fallowField, undefined);
});
