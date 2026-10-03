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


// Rank 3, batch 74 (2026-10-02): Garden of Stone (a basic Reflex save at the cast: 3d10 piercing, +1d10 per rank; the push, the 20-foot difficult terrain and the
// stalagmite's stats at the rank a reminder).

test("Garden of Stone: the cast's basic save and the stalagmite reminder", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/garden-of-stone"));
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.multiplier), [0, 0.5, 1, 2]);
    assert.ok(plan.resolution.reminders.some(r => /AC 10, Hardness 5, 30 Hit Points, \+10 per rank above 3/.test(r.text) && /20-foot emanation/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another push isn't read.
    const other = compile(withText(await spell("rank-3/garden-of-stone"), html => html.replace("pushed to the nearest unoccupied space", "knocked prone")));
    assert.equal(other.compilerEvidence.stoneGarden, undefined);
});
