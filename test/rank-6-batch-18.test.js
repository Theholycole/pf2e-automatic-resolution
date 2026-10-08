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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 6, batch 18 (2026-10-03): Awaken Entropy.
import { isExecutableLingeringPlan as entropyReady } from "../scripts/basic-save-core.js";

test("Awaken Entropy: a lingering basic Fortitude burst; force for a creature void doesn't affect; each Sustain +10 feet (to 40) and the next listed dice", async () => {
    const plan = compile(await spell("rank-6/awaken-entropy"));
    assert.equal(entropyReady(plan), true);
    const growth = plan.resolution.lingering.sustainGrowth;
    assert.deepEqual([growth.feet, growth.maximum, growth.optional, growth.dieSteps], [10, 40, false, ["(2+@item.rank)d8[void]", "(2+@item.rank)d10[void]", "(2+@item.rank)d12[void]"]]);
    assert.deepEqual([plan.resolution.damageSwap.from, plan.resolution.damageSwap.to, plan.resolution.damageSwap.when], ["void", "force", "not-affected"]);
    assert.deepEqual(plan.resolution.lingering.events, ["enter", "turn-start"]);
});
