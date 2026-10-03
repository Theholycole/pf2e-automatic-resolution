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



// Rank 2, batch 63 (2026-10-01): Falsify Heat.

test('Falsify Heat: the two options\' Deception bonuses, the sense note, one target then ten with different options, disbelief by touch', async () => {
    const plan = compile(await spell('rank-2/falsify-heat'));
    const veil = plan.resolution.optionVeil;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, veil.label, veil.durationSeconds, veil.dismissible], ['option-veil', 'automatic', 'body temperature', 28800, true]);
    assert.deepEqual(veil.options.map(option => [option.name, option.bonus.value, option.bonus.type, option.bonus.skill, option.bonus.action, Boolean(option.note)]),
        [['Moderate', 2, 'circumstance', 'deception', 'impersonate', true], ['Warm', 2, 'circumstance', 'deception', 'impersonate', false]]);
    assert.deepEqual(veil.targets.map(tier => [tier.rank, tier.limit, Boolean(tier.eachDifferent)]), [[2, 1, false], [4, 10, true]]);
    assert.deepEqual([veil.disbelieve.by, veil.disbelieve.statistic], ['touch', 'perception']);
});

test('Falsify Heat: a changed bonus, sense or count is not read', async () => {
    const source = await spell('rank-2/falsify-heat');
    for (const [from, to] of [['gaining a +2 circumstance bonus', 'gaining a +2 circumstance bonus and fire resistance 5 and a +2 circumstance bonus'], ['a creature that touches the target', 'a creature that sees the target'],
        ['You can target up to 10 creatures, and you can choose a different body temperature', 'You can target up to 10 creatures, and you can choose a different smell']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'option-veil', from);
    }
});
