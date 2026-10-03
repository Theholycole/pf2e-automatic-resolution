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

// Rank 4, batch 10 (2026-10-02): Suggestion.

test('Suggestion: failure a 1-minute GM note, critical failure the same note for 1 hour', async () => {
    const plan = compile(await spell('rank-4/suggestion'));
    assert.equal(supported(plan), true);
    const failure = plan.resolution.outcomes.failure.noteEffects, critical = plan.resolution.outcomes.criticalFailure.noteEffects;
    assert.equal(failure.length, 1);
    assert.deepEqual([failure[0].duration.value, failure[0].duration.unit], [1, 'minutes']);
    assert.deepEqual([critical[0].duration.value, critical[0].duration.unit], [1, 'hours']);
    assert.deepEqual([plan.resolution.outcomes.criticalSuccess.noteEffects ?? [], plan.resolution.outcomes.success.noteEffects ?? []].map(notes => notes.length), [0, 0]);
    // A critical failure of another length is refused.
    assert.equal(supported(compile(withText(await spell('rank-4/suggestion'), html => html.replace('base duration is 1 hour', 'base duration is 1 fortnight')))), false);
});
