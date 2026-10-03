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



// Rank 2, batch 65 (2026-10-01): Steel Fortifications.

import {inspectSavePlan} from '../scripts/basic-save-core.js';

test('Steel Fortifications: the structures\' statistics, terrain by size, and the save when one breaks', async () => {
    const plan = compile(await spell('rank-2/steel-fortifications'));
    const forts = plan.resolution.fortifications;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, forts.count, forts.size, forts.ac, forts.hardness, forts.hp, forts.brokenThreshold, forts.durationSeconds, forts.rangeFeet],
        ['fortifications', 'automatic', 3, 'lg', 10, 9, 60, 30, 600, 120]);
    assert.deepEqual(forts.immunities, ['critical-hits', 'precision']);
    assert.deepEqual(forts.terrain, {minSize: 'med', difficulty: 2});
    assert.equal(forts.notes.length, 4);
    const crumble = plan.resolution.crumblePlan;
    assert.ok(inspectSavePlan(crumble).supported);
    assert.equal(crumble.resolution.check.statistic, 'reflex');
    assert.match(JSON.stringify(crumble.resolution.outcomes.failure.damage.formulas), /2d6\[persistent,bleed\]/);
    assert.equal(crumble.resolution.outcomes.success.damage.mode, 'none');
});

test('Steel Fortifications: changed statistics, terrain or save are not read', async () => {
    const source = await spell('rank-2/steel-fortifications');
    for (const [from, to] of [['a BT of 30', 'a BT of 90'], ['Medium and larger creatures treat', 'Small and larger creatures avoid'], ['Reflex save or take 2d6 persistent bleed', 'Reflex save or take 2d6 slashing']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'fortifications', from);
    }
});
