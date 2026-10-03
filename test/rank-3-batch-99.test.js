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


// Rank 3, batch 99 (2026-10-03): Horde of Underlings (tokens of one actor with the stated AC and Hit Points and failing saves; each damages an adjacent
// enemy when cast and, on the card's control, after moving up to 20 feet toward the nearest enemy).

test("Horde of Underlings: the horde's statistics and count", async () => {
    const plan = compile(await spell("rank-3/horde-of-underlings"));
    assert.equal(plan.resolution.kind, "minion-horde");
    const data = plan.resolution.minionHorde;
    assert.deepEqual([data.name, data.count, data.hp, data.ac, data.formula, data.moveFeet, data.rangeFeet, data.seconds], ["underlings", 6, 1, 5, "1d4", 20, 30, 60]);
    assert.deepEqual(data.types, ["bludgeoning", "piercing", "slashing"]);
    assert.deepEqual(data.sizes, ["small", "medium"]);
    const { hordeCount } = await import("../src/compiler/minion-horde.js");
    assert.equal(hordeCount(data, 3, 3), 6);
    assert.equal(hordeCount(data, 5, 3), 10);
    // Damage that differs from PF2e's isn't read.
    const other = compile(withText(await spell("rank-3/horde-of-underlings"), html => html.replace("automatically dealing 1d4", "automatically dealing 1d6")));
    assert.notEqual(other.resolution.kind, "minion-horde");
});
