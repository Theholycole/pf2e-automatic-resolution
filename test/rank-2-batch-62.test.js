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



// Rank 2, batch 62 (2026-10-01): Invoke the Crimson Oath.

import {inspectSavePlan} from '../scripts/basic-save-core.js';

test('Invoke the Crimson Oath: a basic save dealt with the held melee weapon, its critical roll on a critical failure', async () => {
    const plan = compile(await spell('rank-2/invoke-the-crimson-oath'));
    const weapon = plan.resolution.weaponDamage;
    assert.deepEqual([plan.resolution.check.statistic, plan.resolution.check.basic, weapon.requirement, weapon.criticalRoll, weapon.critImmuneFails, weapon.convert.to, weapon.convert.trait],
        ['fortitude', true, 'melee', true, true, 'vitality', 'undead']);
    assert.ok(inspectSavePlan(plan).supported);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === 'weapon-critical'));
    assert.equal(inspectSavePlan({...plan, resolution: {...plan.resolution, weaponDamage: {...weapon, sourceText: 'forged'}}}).supported, false);
});

test('Invoke the Crimson Oath: a changed save, requirement or conversion is not read', async () => {
    const source = await spell('rank-2/invoke-the-crimson-oath');
    for (const [from, to] of [['basic Fortitude save', 'basic Reflex save'], ['wielding a melee weapon', 'wielding a ranged weapon'], ['into vitality damage against all undead', 'into fire damage against all undead']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(plan.resolution.weaponDamage, undefined, from);
    }
});
