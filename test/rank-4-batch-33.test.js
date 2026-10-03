import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isCasterDamageBenefit} from '../scripts/basic-save-core.js';

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


// Rank 4, batch 33 (2026-10-02): Vampiric Maiden (temporary Hit Points equal to the void part of piercing and void damage, "after applying
// resistances, weaknesses, and the like": PF2e's own IWR record for that type at runtime).

test("Vampiric Maiden: the void portion's temporary Hit Points", async () => {
    const plan = compile(await spell("rank-4/vampiric-maiden"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const benefit = plan.resolution.casterBenefit;
    assert.equal(benefit.damageType, 'void');
    assert.equal(benefit.portion, 'type');
    assert.deepEqual(benefit.duration, {value: 1, unit: 'minutes'});
    assert.equal(isCasterDamageBenefit(benefit, plan), true);
    assert.equal(isCasterDamageBenefit({...benefit, damageType: 'fire'}, plan), false);
    // A type the spell doesn't deal isn't a portion.
    const other = compile(withText(await spell("rank-4/vampiric-maiden"), html => html.replace('equal to the void damage', 'equal to the fire damage')));
    assert.equal(other.resolution.casterBenefit ?? null, null);
});
