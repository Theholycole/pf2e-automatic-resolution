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


// Rank 5, batch 39 (2026-10-02): Blister (Fortitude: 1, 2 or 4 blisters by result; each pop is 7d6 acid, basic Fortitude, to the target and the
// creatures in a 15-foot cone from it, +1d6 a rank; the spell ends with the last blister).

test("Blister: the blisters the save leaves", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/blister"));
    const pop = plan.resolution.popSave;
    assert.deepEqual([pop.uses, pop.noun, pop.plan.resolution.check.basic, pop.plan.targeting.area], [{ success: 1, failure: 2, criticalFailure: 4 }, "blister", true, { type: "cone", value: 15 }]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const broken = structuredClone(plan); broken.resolution.popSave.uses.failure = 0;
    assert.equal(inspectSavePlan(broken).supported, false);
    // Another count wording isn't read.
    const other = compile(withText(await spell("rank-5/blister"), html => html.replace("grows two blisters", "grows some blisters")));
    assert.equal(other.resolution.popSave, undefined);
});
