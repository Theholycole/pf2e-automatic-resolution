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


// Rank 6, batch 16 (2026-10-03): Spellwrack.

test("Spellwrack: each failing row a curse note whose control gives the persistent force damage (2d12; 4d12 on a critical failure) — 1 minute, or no end", async () => {
    const plan = compile(await spell("rank-6/spellwrack"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = degree => plan.resolution.outcomes[degree].noteEffects[0];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => [note(degree).triggeredDamage.trigger, note(degree).triggeredDamage.dice, note(degree).triggeredDamage.persistent, note(degree).duration.mode]),
        [["spell-affected", 2, true, "fixed"], ["spell-affected", 2, true, "unlimited"], ["spell-affected", 4, true, "unlimited"]]);
});
