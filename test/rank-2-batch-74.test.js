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



// Rank 2, batch 74 (2026-10-01): Burrow Ward.

import {burrowWardRadius} from '../src/compiler/burrow-ward.js';

test('Burrow Ward: the radius by rank, the burrow terrain, the underground save', async () => {
    const plan = compile(await spell('rank-2/burrow-ward'));
    const ward = plan.resolution.burrowWard;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, ward.statistic, ward.durationSeconds], ['burrow-ward', 'automatic', 'fortitude', 60]);
    assert.deepEqual([2, 4, 5, 9].map(rank => burrowWardRadius(ward, rank)), [15, 15, 30, 30]);
    assert.deepEqual(ward.terrain, {action: 'burrow', difficulty: 2});
    assert.match(ward.outcomes.failure, /ejected/);
});

test('Burrow Ward: changed sentences are not read', async () => {
    const source = await spell('rank-2/burrow-ward');
    for (const [from, to] of [['treat the area as difficult terrain', 'treat the area as greater difficult terrain'], ['Those who succeed are forced out', 'Those who succeed take 2d6 damage and are forced out']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'burrow-ward', from);
    }
});
