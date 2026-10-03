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



// Rank 3, batch 9 (2026-10-02): Drain Life.

test('Drain Life: temporary HP from the damage taken, at most the target\'s Hit Points', async () => {
    const plan = compile(await spell('rank-3/drain-life'));
    const benefit = plan.resolution.casterBenefit;
    assert.deepEqual([plan.automation.pendingCapabilities, inspectSavePlan(plan).supported], [[], true]);
    assert.deepEqual([benefit.kind, benefit.measure, benefit.fraction, benefit.duration], ['temp-hp', 'hp-capped', 1, {value: 1, unit: 'minutes'}]);
});

test('Drain Life: without the cap sentence, or with a changed benefit, it is not read', async () => {
    const source = await spell('rank-3/drain-life');
    for (const [from, to] of [["If the target's Hit Points were lower than the damage you dealt, you gain temporary Hit Points equal to their remaining Hit Points instead.", ''],
        ['equal to the damage the target takes, after', 'equal to double the damage the target takes, after'], ['last for 1 minute', 'last for 1 hour']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from.replace("'", '&#39;')) || html.includes(from), from); return html.replace(from, to); }));
        assert.equal(inspectSavePlan(plan).supported, false, from);
    }
});
