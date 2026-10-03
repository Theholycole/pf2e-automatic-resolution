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


// Rank 4, batch 125 (2026-10-03): Bridge of Vines (the GM's drawn bridge; creatures other than the caster and allies entering it save; the rows'
// difficult terrain per creature, Prone, Grabbed until it Escapes; the bridge's statistics a note).

test("Bridge of Vines: the lingering bridge", async () => {
    const plan = compile(await spell("rank-4/bridge-of-vines"));
    const { isExecutableLingeringPlan } = await import("../scripts/basic-save-core.js");
    assert.equal(isExecutableLingeringPlan(plan), true);
    const area = plan.resolution.lingering;
    assert.deepEqual([area.events, area.enemiesOnly, area.excludeCaster, area.drawnArea, area.dismissible], [["enter"], true, true, "a 60-foot line, 10 feet wide, from you", true]);
    assert.deepEqual(area.rowTerrain.degrees, ["success", "failure", "criticalFailure"]);
    assert.equal(area.rowTerrain.until, "spell");
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["prone", "grabbed"]);
    // Unproved row terrain isn't executable.
    const broken = structuredClone(plan); broken.resolution.lingering.rowTerrain.sourceText = "other";
    assert.equal(isExecutableLingeringPlan(broken), false);
});
