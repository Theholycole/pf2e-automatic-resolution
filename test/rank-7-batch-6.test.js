import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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

const supported = plan => inspectSavePlan(plan).supported;


import {thrallChargeDice} from '../src/compiler/thrall-summon.js';

// Rank 7, batch 6 (2026-10-03): Skeletal Lancers, Recurring Nightmare, Living Graveyard, Perfected Thrall, Telekinetic Bombardment.

test("Special thralls: statistics, Thrall Charge dice and controls", async () => {
    const lancers = compile(await spell("rank-7/skeletal-lancers")).resolution.thrallSummon;
    assert.deepEqual([lancers.count, lancers.upTo, lancers.speed, lancers.reach, lancers.damageType, thrallChargeDice(lancers, 7), thrallChargeDice(lancers, 8)], [5, true, 30, 10, "piercing", 2, 3]);
    assert.deepEqual(lancers.controls.map(control => control.kind), ["damage"]);
    const nightmare = compile(await spell("rank-7/recurring-nightmare")).resolution.thrallSummon;
    assert.deepEqual([nightmare.fly, nightmare.damageType, nightmare.controls.map(control => control.kind)], [60, "void", ["save", "resummon"]]);
    assert.ok(supported(nightmare.controls[0].plan));
    const graveyard = compile(await spell("rank-10/living-graveyard")).resolution.thrallSummon;
    assert.deepEqual([graveyard.size, graveyard.hp, graveyard.speed, graveyard.reach, graveyard.appear, graveyard.controls.map(control => control.kind)], ["grg", 400, 60, 15, 5, ["save", "spawn"]]);
    const perfect = compile(await spell("rank-10/perfected-thrall")).resolution.thrallSummon;
    assert.deepEqual([perfect.hp, perfect.speed, perfect.charge.dice, perfect.controls.map(control => control.kind)], [200, 40, 6, ["spawn"]]);
});

test("Telekinetic Bombardment: the save, and the area and rubble reminder", async () => {
    const plan = compile(await spell("rank-7/telekinetic-bombardment"));
    assert.ok(supported(plan));
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "area-shape" && /rubble/.test(reminder.text)));
});
