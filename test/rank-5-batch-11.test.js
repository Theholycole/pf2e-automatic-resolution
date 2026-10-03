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


// Rank 5, batch 11 (2026-10-02): Untwisting Iron Roots (a basic Reflex save with a failed save's Prone, and difficult terrain left in the
// caster's emanation: the card places it).

test('Untwisting Iron Roots: the save, Prone, and the terrain left behind', async () => {
    const plan = compile(await spell('rank-5/untwisting-iron-roots'));
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.leftTerrain, {area: {type: 'emanation', value: 10}, casterExempt: true,
        sourceText: 'The affected area becomes difficult terrain, but you can move through the difficult terrain normally.'});
    assert.ok(plan.resolution.outcomes.failure.effects.some(effect => effect.slug === 'prone'));
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    // Terrain stated another way isn't read.
    const other = compile(withText(await spell('rank-5/untwisting-iron-roots'), html => html.replace('The affected area becomes difficult terrain', 'The affected area becomes greater difficult terrain')));
    assert.equal(supported(other), false);
});
