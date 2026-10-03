import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

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



// Rank 4, batch 2 (2026-10-02): Haunting Spirit.

test('Haunting Spirit: a save at the start of each of the target\'s turns; a critical success ends the spell', async () => {
    const plan = compile(await spell('rank-4/haunting-spirit'));
    assert.deepEqual([isExecutableLingeringPlan(plan), plan.resolution.lingering.events, plan.resolution.lingering.centre, plan.resolution.lingering.initial], [true, ['turn-start'], 'targets', false]);
    assert.equal(plan.resolution.outcomes.criticalSuccess.endsSpell, true);
    assert.ok(/running as far away as possible/.test(plan.resolution.lingering.notes[0]));
});

test('Haunting Spirit: a changed trigger is not read', async () => {
    const source = await spell('rank-4/haunting-spirit');
    const plan = compile(withText(source, html => { assert.ok(html.includes("At the start of each of the target's turns")); return html.replace("At the start of each of the target's turns", "At the start of each of your turns"); }));
    assert.equal(isExecutableLingeringPlan(plan), false);
});
