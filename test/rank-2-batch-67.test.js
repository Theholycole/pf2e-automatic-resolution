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



// Rank 2, batch 67 (2026-10-01): Palm-Held Sun.

import {inspectSavePlan} from '../scripts/basic-save-core.js';

test('Palm-Held Sun: the aura at the text\'s 30 feet, the vitality pulse, the sunlight save, the fire trigger', async () => {
    const plan = compile(await spell('rank-2/palm-held-sun'));
    const sun = plan.resolution.sunAura;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, sun.radius, sun.durationSeconds], ['sun-aura', 'automatic', 30, 60]);
    assert.deepEqual(sun.ruleOverrides, [{index: 1, key: 'Aura', patch: {radius: 30}}]);
    assert.deepEqual(sun.voidHealing, {damage: 1, type: 'vitality'});
    assert.deepEqual(sun.sunlight, {condition: 'slowed', value: 1, rounds: 1, statistic: 'fortitude'});
    assert.deepEqual(sun.fire, {trigger: 'fire', damage: 1, type: 'vitality'});
    assert.ok(inspectSavePlan(plan.resolution.sunlightPlan).supported);
    assert.deepEqual(plan.resolution.sunlightPlan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value]), [['slowed', 1]]);
});

test('Palm-Held Sun: a changed pulse, condition or trigger is not read', async () => {
    const source = await spell('rank-2/palm-held-sun');
    for (const [from, to] of [['each creature with void healing', 'each creature'], ['for 1 round unless', 'for 1 minute unless'], ['due to fire damage', 'due to cold damage']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'sun-aura', from);
    }
});
