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


// Rank 6, batch 15 (2026-10-03): Manifold Lives.

test("Manifold Lives: the rows' damage and Stupefied; the failure's turn-start save granting Slowed 1 (a note for the minute); the critical failure's Slowed 1; immune for a day", async () => {
    const plan = compile(await spell("rank-6/manifold-lives"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [note] = plan.resolution.outcomes.failure.noteEffects;
    assert.deepEqual([note.recurringSave.mode, note.recurringSave.condition.slug, note.duration.value, note.duration.unit], ["turn-condition", "slowed", 1, "minutes"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]), [["stupefied", 4], ["slowed", 1]]);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "days" });
});
