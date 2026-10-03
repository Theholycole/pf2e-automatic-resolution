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


// Rank 5, batch 34 (2026-10-02): Divine Immolation (6d6 fire and (rank − 3)d6 persistent fire, basic Reflex — no persistent on a success,
// double on a critical failure; spirit instead of fire for a creature it hurts more).

test("Divine Immolation: the worse type for each creature", async () => {
    const { executableDamageSwap, moreDetrimental, swapDamageType, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/divine-immolation"));
    assert.deepEqual(plan.resolution.damageSwap, { from: "fire", to: "spirit", when: "more-detrimental", sourceText: plan.resolution.damageSwap.sourceText });
    assert.equal(executableDamageSwap(plan), true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => (plan.resolution.outcomes[d].damage.formulas ?? []).map(f => f.formula)),
        [[], ["(@item.level -3)d6[persistent,fire]"], ["(2*((@item.level -3)d6))[persistent,fire]"]]);
    assert.equal(moreDetrimental({ attributes: { resistances: [{ type: "fire", value: 10 }] } }, "fire", "spirit"), true);
    assert.equal(moreDetrimental({ attributes: { weaknesses: [{ type: "fire", value: 5 }] } }, "fire", "spirit"), false);
    assert.equal(moreDetrimental({ attributes: { immunities: [{ type: "spirit" }], resistances: [{ type: "fire", value: 10 }] } }, "fire", "spirit"), false);
    assert.equal(moreDetrimental({ attributes: {} }, "fire", "spirit"), false);
    assert.match(JSON.stringify(swapDamageType({ formula: "{(2d6)[persistent,fire]}", options: { flavor: "persistent,fire" } }, "fire", "spirit")), /persistent,spirit\]\}.*"flavor":"persistent,spirit"/);
    // Another determination isn't read.
    const other = compile(withText(await spell("rank-5/divine-immolation"), html => html.replace("(as determined by the GM)", "(as the caster chooses)")));
    assert.equal(other.resolution.damageSwap, undefined);
});
