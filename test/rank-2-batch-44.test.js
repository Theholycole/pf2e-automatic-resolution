import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 44 (2026-10-01): Albatross Curse.

test('Albatross Curse: a save deferred to the GM\'s control, with PF2e\'s row Effects removed after the next save', async () => {
    const plan = compile(await spell('rank-2/albatross-curse'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['deferred-save', 'automatic']);
    const data = plan.resolution.deferredSave;
    assert.deepEqual([data.statistic, data.trigger, data.rows.success.condition.slug, data.rows.success.condition.value], ['will', 'albatross', 'stupefied', 1]);
    assert.deepEqual(data.ruleOverrides, [{index: 0, key: 'RollTwice', patch: {removeAfterRoll: true}}]);
    assert.notEqual(compile(withText(await spell('rank-2/albatross-curse'), html => html.replace('+1 circumstance bonus', '+2 circumstance bonus'))).resolution.kind, 'deferred-save');
});
