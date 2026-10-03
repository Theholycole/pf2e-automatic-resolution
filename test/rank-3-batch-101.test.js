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


// Rank 3, batch 101 (2026-10-03): One with Stone (One with Plants' rule family: the stone a Large battle form, AC 23, no trait, Reflex successes are
// failures; merged, Blinded; both Immobilized; the stone's damage expels for 10d6).

test("One with Stone: the plant-form family with stone", async () => {
    const plan = compile(await spell("rank-3/one-with-stone"));
    assert.equal(plan.resolution.kind, "plant-form");
    const data = plan.resolution.plantForm;
    assert.equal(data.substance, "stone");
    assert.deepEqual([data.modes.tree.durationSeconds, data.modes.tree.size, data.modes.tree.ac, data.modes.tree.worse.statistic], [28800, "lg", 23, "reflex"]);
    assert.deepEqual(data.modes.tree.traits, []);
    assert.deepEqual([data.modes.merge.durationSeconds, data.modes.merge.expel.formula, data.modes.merge.blinded], [600, "10d6", true]);
    const plants = compile(await spell("rank-2/one-with-plants"));
    assert.deepEqual([plants.resolution.plantForm.substance, plants.resolution.plantForm.modes.tree.traits.join()], ["plant", "plant"]);
    // A stone that mixes in the plant's words isn't read.
    const other = compile(withText(await spell("rank-3/one-with-stone"), html => html.replace("You become a Large stone.", "You become a Large plant.")));
    assert.notEqual(other.resolution.kind, "plant-form");
});
