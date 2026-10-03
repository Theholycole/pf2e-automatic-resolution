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


// Rank 4, batch 102 (2026-10-03): Prophet's Luck (the caster's prediction; the target's modifier to the triggering save, used up by it; the result's aftermath
// for the spell's duration — the caster's bonus or the target's penalty to saves; +2/−2 from 6th, +3/−3 from 9th).

test("Prophet's Luck: a foretold save and its aftermath", async () => {
    const { prophecyValue } = await import("../src/compiler/prophecy.js");
    const { rollConsumes } = await import("../scripts/climb-aid-runtime.js");
    const plan = compile(await spell("rank-4/prophets-luck"));
    assert.equal(plan.resolution.kind, "prophecy");
    const prophecy = plan.resolution.prophecy;
    assert.deepEqual([prophecyValue(prophecy, 4), prophecyValue(prophecy, 6), prophecyValue(prophecy, 8), prophecyValue(prophecy, 9)], [1, 2, 2, 3]);
    assert.equal(prophecy.minutes, 10);
    assert.equal(rollConsumes({ on: "saving-throw" }, { type: "saving-throw", options: new Set() }), true);
    // Uneven bonus and penalty, or another trigger, isn't read.
    const other = compile(withText(await spell("rank-4/prophets-luck"), html => html.replace("you gain a +1 status bonus", "you gain a +2 status bonus")));
    assert.notEqual(other.resolution.kind, "prophecy");
});
