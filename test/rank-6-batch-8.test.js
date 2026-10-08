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


// Rank 6, batch 8 (2026-10-03): Necrotize.

test("Necrotize: the cast's 1d4 picks the body part of PF2e's Effect (each part's rule proved); a critical failure adds the caster's second pick", async () => {
    const plan = compile(await spell("rank-6/necrotize"));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.conditionRoll.kind, plan.resolution.conditionRoll.formula, plan.resolution.conditionRoll.results[2]], ["native-choice", "1d4", "joints"]);
    assert.deepEqual([plan.resolution.casterChoice.pick, plan.resolution.casterChoice.rows, plan.resolution.casterChoice.values], ["native-part", ["criticalFailure"], ["bones", "joints", "legs", "muscles"]]);
    const picks = degree => plan.resolution.outcomes[degree].nativeEffects.map(effect => effect.outcomeRule.pick);
    assert.deepEqual([picks("success"), picks("failure"), picks("criticalFailure")], [["rolled"], ["rolled"], ["rolled", "caster"]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].damage.multiplier), [0.5, 1, 2]);
});
