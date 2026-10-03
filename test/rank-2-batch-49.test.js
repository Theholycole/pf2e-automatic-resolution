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



// Rank 2, batch 49 (2026-10-01): Light of Revelation, Fungal Hyphae.

test('Light of Revelation\'s ally aura; Fungal Hyphae\'s sense and plant Strikes from 4th', async () => {
    const light = compile(await spell('rank-2/light-of-revelation'));
    assert.deepEqual([light.resolution.kind, light.resolution.lightAura.radius, light.resolution.lightAura.bonus], ['light-aura', 30, {selector: 'perception', type: 'status', value: 1, predicate: ['action:seek']}]);
    const hyphae = compile(await spell('rank-2/fungal-hyphae'));
    assert.deepEqual([hyphae.resolution.kind, hyphae.resolution.hyphae.sense, hyphae.resolution.hyphae.strikes.fromRank, hyphae.resolution.hyphae.strikes.formula, hyphae.resolution.hyphae.manipulate.fromRank],
        ['hyphae', {selector: 'tremorsense', acuity: 'imprecise', range: 30}, 4, '3d8', 6]);
    assert.notEqual(compile(withText(await spell('rank-2/light-of-revelation'), html => html.replace('+1 status bonus', '+2 status bonus to attack rolls and'))).resolution.kind, 'light-aura');
});
