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



// Rank 2, batch 72 (2026-10-01): Banishing Touch.

import {launchAt} from '../src/compiler/mythic-launch.js';

test('Banishing Touch: damage and distances by actions and rank, the fall', async () => {
    const plan = compile(await spell('rank-2/banishing-touch'));
    const data = plan.resolution.mythicLaunch;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.type], ['mythic-launch', 'automatic', 'bludgeoning']);
    const at = (actions, rank) => { const v = launchAt(data, actions, rank); return [v.formula, v.up, v.back, v.fall]; };
    assert.deepEqual([at(1, 2), at(2, 2), at(3, 2), at(1, 4), at(3, 4), at(2, 6), at(3, 8)],
        [['1d6', 10, 10, 5], ['2d6', 20, 10, 10], ['2d6', 30, 20, 15], ['2d6', 20, 20, 10], ['3d6', 50, 40, 25], ['4d6', 80, 70, 40], ['5d6', 130, 120, 65]]);
});

test('Banishing Touch: changed rows or steps are not read', async () => {
    const source = await spell('rank-2/banishing-touch');
    for (const [from, to] of [['at mythic proficiency', 'at master proficiency'], ['launched 30 feet into the air and pushed back 20 feet', 'launched 30 feet into the air and teleported 20 feet'], ['The initial damage increases by 2d6', 'The initial damage increases by 4d6']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'mythic-launch', from);
    }
});
