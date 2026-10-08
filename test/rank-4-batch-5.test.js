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



import {damagingWallAt} from '../src/compiler/damaging-wall.js';

// Rank 4, batch 5 (2026-10-02): Wall of Fire, Wall of Thorns, Wall of Ice — walls whose crossing hurts.

test('Wall of Fire: the GM\'s crossing control and the turn-start damage, +1d6 a rank', async () => {
    const plan = compile(await spell('rank-4/wall-of-fire'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['damaging-wall', 'automatic']);
    const data = plan.resolution.damagingWall;
    assert.deepEqual([data.control.turnStart, data.terrain, damagingWallAt(data, 6).formula], [true, false, '6d6']);
    assert.notEqual(compile(withText(await spell('rank-4/wall-of-fire'), html => html.replace('takes 4d6 fire damage', 'takes 4d6 fire damage and is Dazzled'))).resolution.kind, 'damaging-wall');
});

test('Wall of Thorns: difficult terrain, damage per move action, section Hit Points by rank', async () => {
    const data = compile(await spell('rank-3/wall-of-thorns')).resolution.damagingWall;
    assert.deepEqual([data.terrain, data.control.perAction, damagingWallAt(data, 5)], [true, true, {formula: '5d4', type: 'piercing', sectionHP: 30}]);
});

test('Wall of Ice: the text\'s +2 interval (not the item\'s +1) for the rubble\'s cold and the Hit Points', async () => {
    const data = compile(await spell('rank-5/wall-of-ice')).resolution.damagingWall;
    assert.deepEqual([damagingWallAt(data, 6), damagingWallAt(data, 7)], [{formula: '2d6', type: 'cold', sectionHP: 40}, {formula: '3d6', type: 'cold', sectionHP: 50}]);
    assert.ok(data.notes.some(note => /draw it as difficult terrain/.test(note)));
});
