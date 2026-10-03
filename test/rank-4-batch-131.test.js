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


// Rank 4, batch 131 (2026-10-03): Dutiful Challenge (PF2e's caster Effect proved; the enemy's penalty against all but the caster; the exempting Will save;
// either defeated ends both).

test("Dutiful Challenge: the challenge", async () => {
    const plan = compile(await spell("rank-4/dutiful-challenge"));
    assert.equal(plan.resolution.kind, "challenge");
    const data = plan.resolution.challenge;
    assert.deepEqual([data.type, data.value, data.step, data.statistic, data.seconds, data.markSlug], ["status", 1, { interval: 3, add: 1 }, "will", 60, "dutiful-challenge"]);
    const { challengePenalty } = await import("../src/compiler/challenge.js");
    assert.deepEqual([4, 6, 7, 10].map(rank => challengePenalty(data, rank, 4)), [1, 1, 2, 3]);
    // A different penalty isn't proved against PF2e's Effect.
    const other = compile(withText(await spell("rank-4/dutiful-challenge"), html => html.replace(/-1 status penalty/g, "-2 status penalty")));
    assert.notEqual(other.resolution.kind, "challenge");
});
