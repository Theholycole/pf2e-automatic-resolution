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



// Rank 2, batch 37 (2026-10-01): Avenging Wildwood.

test('Avenging Wildwood: a sustained spell attack from a conjured tree with the stated statistics', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/avenging-wildwood');
    const plan = compile(source);
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.repeatable.window, 'sustain');
    assert.equal(plan.resolution.sharedDamage.formula, '(2+floor((@item.rank - 2)/2)*1)d8[untyped]');
    assert.deepEqual(plan.resolution.casterChoice.values, ['bludgeoning', 'piercing', 'slashing']);
    const tree = plan.resolution.conjuredCreature;
    assert.deepEqual([tree.name, tree.size, tree.hp, tree.reach, tree.rangeFeet], ['tree', 'med', {base: 20, step: 10, interval: 2, baseRank: 2}, 15, 60]);
    const forged = structuredClone(plan); forged.resolution.conjuredCreature.ac = 'fixed';
    assert.equal(inspectSavePlan(forged).supported, false);
    // Another statistic sentence keeps it out.
    assert.equal(compile(withText(source, html => html.replace('and it has 20 Hit Points', 'and it has 20 Hit Points and resistance 5 to fire'))).resolution.conjuredCreature, undefined);
});
