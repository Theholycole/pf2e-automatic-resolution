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


// Rank 3, batch 76 (2026-10-02): Swamp of Sloth (a lingering burst of difficult terrain whose turn-end basic Fortitude save deals the poison damage; 5 feet,
// the smallest burst, plus 5 for each action past the first and each heightening step).

test("Swamp of Sloth: the turn-end save of a burst the actions widen", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/swamp-of-sloth"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.events, lingering.area, lingering.terrain?.difficulty, lingering.actionStep.feet, lingering.areaStep.interval, lingering.areaStep.feet],
        [["turn-end"], { type: "burst", value: 5 }, 2, 5, 2, 5]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-end" })).blockers ?? [], []);
    // The step without the compiled sentence is refused.
    const bad = structuredClone(plan); bad.compilerEvidence.slothSwamp = [];
    assert.equal(isExecutableLingeringPlan(bad), false);
    // Another growth isn't read.
    const other = compile(withText(await spell("rank-3/swamp-of-sloth"), html => html.replace("increase the burst's radius by 5 feet", "increase the burst's radius by 10 feet")));
    assert.equal(other.compilerEvidence.slothSwamp, undefined);
});
