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


// Rank 4, batch 83 (2026-10-02): Asterism (lines of starlight the GM draws as shapes of one region; entering one or starting a turn in one: 4d6 fire, basic Reflex, once a
// turn; the asterism's anchors and the breaking lines a reminder; Dismiss).

test("Asterism: the lines' lingering save, once a turn", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/asterism"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.oncePerTurn, plan.resolution.lingering.dismissible], [["enter", "turn-start"], true, true]);
    assert.ok(plan.resolution.reminders.some(r => /part of the asterism/.test(r.text)));
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "enter" })).blockers ?? [], []);
    // Another line count isn't read.
    const other = compile(withText(await spell("rank-4/asterism"), html => html.replace("Draw five lines", "Draw four lines")));
    assert.equal(other.compilerEvidence.starLines, undefined);
});
