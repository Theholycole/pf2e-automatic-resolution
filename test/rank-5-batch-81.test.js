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


// Rank 5, batch 81 (2026-10-03): Mantle of the Magma Heart (PF2e's Effect, each option proved; the text's Clumsy and reach added; Heart of Fire's burn and the
// swap the option-mantle runtime's).

test("Mantle of the Magma Heart: the mantle", async () => {
    const plan = compile(await spell("rank-5/mantle-of-the-magma-heart"));
    assert.equal(plan.resolution.kind, "option-mantle");
    const data = plan.resolution.optionMantle;
    assert.deepEqual(data.options.map(option => option.value), ["enlarging-eruption", "fiery-grasp", "heart-of-fire", "warming-flames"]);
    assert.deepEqual([data.swapTrait, data.sizeLimit, data.retaliation.formula, data.retaliation.type], ["Sustain", { option: "enlarging-eruption", below: "lg" }, "2d6", "fire"]);
    assert.deepEqual(data.ruleOverrides[0].patch, { reach: { add: 5 } });
    assert.equal(data.ruleAdditions[0].key, "GrantItem");
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/mantle-of-the-magma-heart"), html => html.replace("You gain resistance 5 to cold and fire.", "You gain resistance 10 to cold and fire.")));
    assert.notEqual(other.resolution.kind, "option-mantle");
});
