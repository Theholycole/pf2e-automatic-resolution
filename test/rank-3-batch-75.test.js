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


// Rank 3, batch 75 (2026-10-02): Wall of Radiance (a lingering line the GM places; a creature moving into it takes 2d6 fire — 3d6 from 4th — with a basic
// Fortitude save; the dazzle beside it and the heightened concealment a reminder).

test("Wall of Radiance: the wall's entry save as a lingering line", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/wall-of-radiance"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.area], [["enter"], false, { type: "line", value: 60 }]);
    assert.ok(plan.resolution.reminders.some(r => /Dazzled/.test(r.text) && /4th rank/.test(r.text)));
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "enter" })).blockers ?? [], []);
    // Another trigger isn't read.
    const other = compile(withText(await spell("rank-3/wall-of-radiance"), html => html.replace("Creatures that move through the wall", "Creatures that touch the wall")));
    assert.equal(other.compilerEvidence.radiantWall, undefined);
});
