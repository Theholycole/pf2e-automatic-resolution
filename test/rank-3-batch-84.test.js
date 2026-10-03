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


// Rank 3, batch 84 (2026-10-03): Coral Scourge (the clumsy Effect ends on the target's Interact, and the spell with it; a failure's grows by 1 as each of the
// target's turns begins, to 4, where Paralyzed is granted for the rest of the spell; a critical failure's Interact lowers it by 1 and 0 doesn't end it).

test("Coral Scourge: an Interact ending, turn-start growth to a maximum, and a lowering Interact", async () => {
    const { isConditionGrowth } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/coral-scourge"));
    assert.equal(supported(plan), true);
    const clumsy = degree => plan.resolution.outcomes[degree].effects.find(effect => effect.slug === "clumsy");
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => [clumsy(degree).value, clumsy(degree).endsWhen[0].action, clumsy(degree).growth?.interact ?? null]),
        [[1, "interact", null], [2, "interact", "end"], [2, "interact", "reduce"]]);
    const growth = clumsy("failure").growth;
    assert.deepEqual([growth.timing, growth.step, growth.maximum, growth.atMaximum.slug], ["turn-start", 1, 4, "paralyzed"]);
    const bad = structuredClone(clumsy("failure")); bad.growth.maximum = 9;
    assert.equal(isConditionGrowth(bad), false);
    // Another growth wording, or a maximum the paralysis doesn't share, isn't read.
    const other = compile(withText(await spell("rank-3/coral-scourge"), html => html.replace("to a maximum of 4", "without a maximum")));
    assert.equal(other.compilerEvidence.growingCondition, undefined);
    assert.equal(supported(other), false);
    const mismatch = compile(withText(await spell("rank-3/coral-scourge"), html => html.replace("reaches 4", "reaches 3")));
    assert.equal(mismatch.compilerEvidence.growingCondition, undefined);
});
