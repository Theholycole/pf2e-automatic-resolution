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



// Rank 2, batch 64 (2026-10-01): Magnetic Repulsion.

import {repulsionPenalty} from '../src/compiler/repulsion-aura.js';

test('Magnetic Repulsion: the penalty by rank and metal, the terrain per kind, the caster\'s Slowed', async () => {
    const plan = compile(await spell('rank-2/magnetic-repulsion'));
    const aura = plan.resolution.repulsionAura;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, aura.durationSeconds], ['repulsion-aura', 'automatic', 60]);
    assert.deepEqual(aura.terrain, {armor: 2, metal: 3});
    assert.deepEqual([aura.casterCondition.slug, aura.casterCondition.value, aura.casterCondition.when], ['slowed', 1, 'metal-armor']);
    assert.deepEqual([[2, false], [2, true], [5, false], [5, true], [8, false]].map(([rank, metal]) => repulsionPenalty(aura, rank, 2, metal)), [1, 2, 2, 3, 3]);
});

test('Magnetic Repulsion: a changed penalty, terrain or condition is not read', async () => {
    const source = await spell('rank-2/magnetic-repulsion');
    for (const [from, to] of [['take a -1 status penalty', 'take a -1 circumstance penalty'], ['are greater difficult terrain', 'are hazardous terrain'], ['you\'re @UUID', 'you\'re Clumsy and @UUID']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'repulsion-aura', from);
    }
});
