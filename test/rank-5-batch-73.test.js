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


// Rank 5, batch 73 (2026-10-03): Mantle of the Unwavering Heart (PF2e's Effect, each option proved; the picks its choices; its Grab note keyed to them; the
// card's swap).

test("Mantle of the Unwavering Heart: the mantle", async () => {
    const plan = compile(await spell("rank-5/mantle-of-the-unwavering-heart"));
    assert.equal(plan.resolution.kind, "option-mantle");
    const data = plan.resolution.optionMantle;
    assert.deepEqual([data.seconds, data.picks, data.swapTrait, data.slots.length], [60, 2, "concentrate", 2]);
    assert.deepEqual(data.options.map(option => option.value), ["evergreen-vitality", "overwhelming-perfume", "towering-trunk", "unyielding-will"]);
    assert.deepEqual(data.ruleOverrides[0].patch.predicate, [{ or: ["unwavering-heart-first:towering-trunk", "unwavering-heart-second:towering-trunk"] }]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/mantle-of-the-unwavering-heart"), html => html.replace("You gain fast healing 3", "You gain fast healing 5")));
    assert.notEqual(other.resolution.kind, "option-mantle");
});
