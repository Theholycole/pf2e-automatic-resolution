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



// Rank 2, batch 71 (2026-10-01): Blazing Armory.

import {conjuredWeaponsAt} from '../src/compiler/blazing-weapons.js';

test('Blazing Armory: runes and targets by rank, fire damage locked, the touch damage', async () => {
    const plan = compile(await spell('rank-2/blazing-armory'));
    const data = plan.resolution.conjuredWeapons;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.damageType, data.lockType, data.durationSeconds], ['conjured-weapons', 'automatic', 'fire', true, 300]);
    assert.deepEqual(data.categories, ['simple', 'martial']);
    assert.deepEqual([2, 4, 6, 8, 10].map(rank => { const at = conjuredWeaponsAt(data, rank); return [at.limit, at.runes.potency, at.runes.striking, at.runes.property.join()]; }),
        [[1, 1, 1, ''], [5, 1, 1, 'flaming'], [5, 2, 2, 'flaming'], [5, 3, 2, 'greaterFlaming'], [5, 3, 3, 'greaterFlaming']]);
    assert.deepEqual(data.touch, {formula: '1d6', type: 'fire'});
});

test('Blazing Armory: an unknown rune or extra damage type is not read; the text\'s potency is', async () => {
    const source = await spell('rank-2/blazing-armory');
    for (const [from, to] of [['its damage type changes to fire. The damage type can', 'its damage type changes to fire and cold. The damage type can'], ['+2 greater striking flaming', '+2 greater striking frost']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'conjured-weapons', from);
    }
    const raised = compile(withText(source, html => html.replace('<em>+1 striking weapon</em>', '<em>+2 striking weapon</em>')));
    assert.equal(conjuredWeaponsAt(raised.resolution.conjuredWeapons, 2).runes.potency, 2);
});
