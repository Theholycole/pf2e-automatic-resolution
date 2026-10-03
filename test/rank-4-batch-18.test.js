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

import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// Rank 4, batch 18 (2026-10-02): Diamond Dust — the caster's emanation (2d6 cold, basic Fortitude) on entering or ending a turn inside, once
// per turn (not per round); the light and Sustain-toggle rules are notes; Dismissable.

test('Diamond Dust: a lingering emanation, once per turn, caster excluded, two notes', async () => {
    const plan = compile(await spell('rank-4/diamond-dust'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.events, lingering.oncePerTurn, lingering.oncePerRound, lingering.excludeCaster], ['caster', ['enter', 'turn-end'], true, false, true]);
    assert.equal(lingering.notes.length, 2);
    // Another light rule is refused.
    assert.equal(isExecutableLingeringPlan(compile(withText(await spell('rank-4/diamond-dust'), html => html.replace('+2 status bonus', '+3 status bonus to attack rolls and')))), false);
});
