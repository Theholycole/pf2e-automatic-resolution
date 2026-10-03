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



// Rank 2, batch 58 (2026-10-01): Blazing Blade.

import {inspectSavePlan, heightenedPlanAt} from '../scripts/basic-save-core.js';

test('Blazing Blade: a melee spell attack repeatable for the duration; a critical hit\'s persistent spirit from 4th', async () => {
    const plan = compile(await spell('rank-2/blazing-blade'));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual([plan.resolution.repeatable.window, plan.resolution.repeatable.actions, plan.resolution.repeatable.attacks], ['duration', 1, undefined]);
    assert.deepEqual([plan.lifecycle.durationSpec.value, plan.lifecycle.durationSpec.unit], [1, 'minutes']);
    assert.ok(inspectSavePlan(plan).supported);
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.mode, 'shared');
    const at4 = heightenedPlanAt(plan, 4);
    assert.match(JSON.stringify(at4.resolution.outcomes.criticalSuccess.damage.formulas), /persistent,spirit/);
    assert.ok(inspectSavePlan(at4).supported);
    assert.equal(heightenedPlanAt(plan, 3).resolution.outcomes.criticalSuccess.damage.mode, 'shared');
});

test('Blazing Blade: a changed persistent die, step or damage is not read', async () => {
    const source = await spell('rank-2/blazing-blade');
    for (const [from, to] of [['the target takes 2d6 persistent spirit damage', 'the target takes 3d6 persistent spirit damage'], ['fire damage increases to 3d6', 'fire damage increases to 5d6'],
        ['deals 1d6 fire damage plus 1d6 spirit damage', 'deals 1d8 fire damage plus 1d6 spirit damage']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.repeatable?.window, 'duration', from);
    }
});
