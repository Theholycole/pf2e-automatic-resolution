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



// Rank 2, batch 66 (2026-10-01): Reaper's Lantern.

test('Reaper\'s Lantern: one save each, half healing (living) or Enfeebled 1 (undead) while inside, growing on Sustain', async () => {
    const plan = compile(await spell('rank-2/reapers-lantern'));
    const lantern = plan.resolution.lanternAura;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, lantern.radius, lantern.durationSeconds, lantern.statistic, lantern.growth.feet],
        ['lantern-aura', 'automatic', 5, 60, 'fortitude', 5]);
    assert.deepEqual(lantern.failed.living, {halfHealing: true});
    assert.deepEqual([lantern.failed.undead.condition, lantern.failed.undead.value], ['enfeebled', 1]);
    assert.deepEqual(lantern.light, {brightTimes: 1, dimTimes: 2});
});

test('Reaper\'s Lantern: changed rows, memory or growth are not read', async () => {
    const source = await spell('rank-2/reapers-lantern');
    for (const [from, to] of [['gain only half the normal benefit', 'gain no benefit'], ['it uses the same outcome', 'it attempts a new save'], ['radius by 5 feet', 'radius by 5 feet and deal 1d6 damage']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'lantern-aura', from);
    }
});
