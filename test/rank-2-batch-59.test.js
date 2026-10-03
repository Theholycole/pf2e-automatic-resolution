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



// Rank 2, batch 59 (2026-10-01): Swallow Light.

import {inspectSavePlan} from '../scripts/basic-save-core.js';

test('Swallow Light: a basic Reflex save in the cone, repeatable after the counteract gate, with a 1d4-round recharge', async () => {
    const plan = compile(await spell('rank-2/swallow-light'));
    const repeat = plan.resolution.repeatable;
    assert.deepEqual([plan.resolution.check.statistic, plan.resolution.check.basic, repeat.window, repeat.actions, repeat.recharge.formula, repeat.gate.kind, repeat.gate.target],
        ['reflex', true, 'duration', 2, '1d4', 'counteract', 'light effect']);
    assert.ok(inspectSavePlan(plan).supported);
    // (A forged gate or recharge isn't executable.)
    assert.equal(inspectSavePlan({...plan, resolution: {...plan.resolution, repeatable: {...repeat, recharge: {formula: '1d4+20', unit: 'rounds'}}}}).supported, false);
    assert.equal(inspectSavePlan({...plan, resolution: {...plan.resolution, repeatable: {...repeat, gate: null}}}).supported, false);
});

test('Swallow Light: a changed area, damage or recharge is not read', async () => {
    const source = await spell('rank-2/swallow-light');
    for (const [from, to] of [['15-foot cone', '30-foot cone'], ['deals 1d6 cold damage plus 1d6 void', 'deals 2d6 cold damage plus 1d6 void'], ['two-action activity', 'single action']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.repeatable?.window, 'duration', from);
    }
});
