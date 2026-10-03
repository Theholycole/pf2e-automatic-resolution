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


// Rank 3, batch 97 (2026-10-03): Life Pact (an Effect on each target; damage about to reduce one to 0 Hit Points first takes the stated Hit Points
// from each other member and gives it their total, just before the damage; then the pact ends).

test("Life Pact: the pact's members and Hit Points at each rank", async () => {
    const plan = compile(await spell("rank-3/life-pact"));
    assert.equal(plan.resolution.kind, "hp-pact");
    const data = plan.resolution.hpPact;
    assert.deepEqual([data.targets, data.seconds, data.amount], [6, 600, 3]);
    const { pactAmount } = await import("../src/compiler/hp-pact.js");
    assert.equal(pactAmount(data, 3, 3), 3);
    assert.equal(pactAmount(data, 6, 3), 6);
    // A pact that triggers on something else isn't read.
    const other = compile(withText(await spell("rank-3/life-pact"), html => html.replace("reduce it to 0 Hit Points,", "reduce it below half its Hit Points,")));
    assert.notEqual(other.resolution.kind, "hp-pact");
});
