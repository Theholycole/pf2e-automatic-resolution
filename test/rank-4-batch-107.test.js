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


// Rank 4, batch 107 (2026-10-03): Sudden Swarm (the familiar's swarm Effect at the cast rank; Swarming Bites a compiled basic Reflex save of the item's
// damage, once per turn).

test("Sudden Swarm: the swarm form and its bites", async () => {
    const plan = compile(await spell("rank-4/sudden-swarm"));
    assert.equal(plan.resolution.kind, "familiar-swarm");
    const data = plan.resolution.familiarSwarm;
    assert.deepEqual([data.weakness, data.resistance, data.step, data.statistic], [4, 4, 1, "reflex"]);
    assert.equal(supported(data.bitesPlan), true);
    const { familiarSwarmRules } = await import("../src/compiler/familiar-swarm.js");
    const rules = familiarSwarmRules(data, 6, 4);
    assert.deepEqual(rules.filter(rule => rule.key === "Resistance").map(rule => rule.value), [6, 6]);
    assert.ok(rules.some(rule => rule.key === "Immunity" && rule.type === "prone"));
    // Different numbers aren't read.
    const other = compile(withText(await spell("rank-4/sudden-swarm"), html => html.replace("resistances and weaknesses increase by 1", "resistances and weaknesses increase by 2 and more")));
    assert.notEqual(other.resolution.kind, "familiar-swarm");
});
