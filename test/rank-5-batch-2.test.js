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



// Rank 5, batch 2 (2026-10-02): Glossolalia.

test('Glossolalia: "varies" from the rows\' own notes; the critical failure lasts 1 minute', async () => {
    const plan = compile(await spell('rank-5/glossolalia'));
    assert.deepEqual([inspectSavePlan(plan).supported, plan.lifecycle.durationSpec.mode], [true, 'outcome']);
    const time = degree => plan.resolution.outcomes[degree].noteEffects.map(note => `${note.duration.value} ${note.duration.unit}`);
    assert.deepEqual([time('success'), time('failure'), time('criticalFailure')], [['1 rounds'], ['1 rounds'], ['1 minutes']]);
    assert.ok(!/^For 1 round/.test(plan.resolution.outcomes.criticalFailure.noteEffects[0].text));
});
