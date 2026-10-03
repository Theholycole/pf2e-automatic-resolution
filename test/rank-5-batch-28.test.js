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


// Rank 5, batch 28 (2026-10-02): Glacial Heart (10d6 cold, Fortitude, then immune for a day: a success half and Slowed 1 for 1 round; a failure full
// and Slowed 1, a critical failure double and Slowed 2, with an end-of-turn save that raises it by 1 (2 on a critical failure, at most 4) or lowers
// it by 1, ending at 0; the encasing ice a GM note).

test("Glacial Heart: the escalating end-of-turn save", async () => {
    const plan = compile(await spell("rank-5/glacial-heart"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "days" });
    const slowed = degree => plan.resolution.outcomes[degree].effects.find(e => e.slug === "slowed");
    assert.deepEqual([slowed("success").value, slowed("success").recurringSave], [1, undefined]);
    assert.deepEqual([slowed("failure").value, slowed("criticalFailure").value], [1, 2]);
    assert.deepEqual(slowed("failure").recurringSave.steps, { criticalSuccess: -1, success: -1, failure: 1, criticalFailure: 2 });
    assert.equal(slowed("failure").recurringSave.maximum, 4);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].label, "Encased in ice");
    // An escalation past the stated cap isn't executable.
    const broken = structuredClone(plan); broken.resolution.outcomes.failure.effects.find(e => e.slug === "slowed").recurringSave.maximum = 9;
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
});
