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



// Rank 2, batch 55 (2026-10-01): Gentle Breeze.

import {areaBoonHealing} from '../src/compiler/area-boon.js';

test('Gentle Breeze: an area whose occupants hold PF2e\'s Effect, healing those who stay', async () => {
    const plan = compile(await spell('rank-2/gentle-breeze'));
    const boon = plan.resolution.areaBoon;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, boon.area.value, boon.durationSeconds], ['area-boon', 'automatic', 40, 600]);
    assert.deepEqual(boon.ruleAdditions.map(rule => [rule.key, rule.option, rule.toggleable]), [['RollOption', 'benefit-creature', true]]);
    assert.deepEqual([2, 3, 4, 6, 9].map(rank => areaBoonHealing(boon, rank, 2)), [10, 10, 20, 30, 40]);
    assert.equal(boon.notes.length, 1);
});

test('Gentle Breeze: a changed bonus, healing or step is not read', async () => {
    const source = await spell('rank-2/gentle-breeze');
    for (const [from, to] of [['get a +2 status bonus', 'get a +3 status bonus'], ['regains 10 Hit Points', 'regains 12 Hit Points'], ['The healing increases by 10', 'The healing increases by 15'],
        ['if it remains within the area for the full duration', 'if it remains within the area for 1 minute']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'area-boon', from);
    }
});
