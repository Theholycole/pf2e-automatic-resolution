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


// Rank 6, batch 13 (2026-10-03): Dominate, Never Mind.

test("Dominate: Controlled for a day (a failure with the end-of-turn Will save, a critical failure with the GM's note); the unlimited 10th rank refused", async () => {
    const plan = compile(await spell("rank-6/dominate"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [failure] = plan.resolution.outcomes.failure.effects, [critical] = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual([failure.slug, failure.duration.value, failure.duration.unit, failure.recurringSave.mode, critical.slug, critical.recurringSave ?? null], ["controlled", 1, "days", "end", "controlled", null]);
    assert.deepEqual([plan.resolution.rankGate.minRank, plan.resolution.outcomes.criticalFailure.noteEffects[0].label], [10, "Dominated"]);
});

test("Never Mind: a failure Stupefied 4 with no end; a critical failure's Effect overriding Charisma, Intelligence and Wisdom to −5", async () => {
    const plan = compile(await spell("rank-6/never-mind"));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.outcomes.failure.effects[0].duration.mode, "unlimited");
    const [note] = plan.resolution.outcomes.criticalFailure.noteEffects;
    assert.deepEqual(note.rules.map(rule => [rule.path, rule.value]), [["system.abilities.cha.mod", -5], ["system.abilities.int.mod", -5], ["system.abilities.wis.mod", -5]]);
});
