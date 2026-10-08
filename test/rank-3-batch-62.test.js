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


// Rank 3, batch 62 (2026-10-02): Undertow (a lingering water area: a Fortitude save at the start of a turn inside — 2d6 / 4d6 bludgeoning, and on
// the failing rows PF2e's Effect (−2 to Swim checks, −10 swim Speed) until the creature leaves the area; the critical failure's pull down a GM note).

test("Undertow: the water's rows and its Effect", async () => {
    const { proveAreaPenalty } = await import("../src/compiler/native-outcome-effect-compiler.js");
    const plan = compile(await spell("rank-3/undertow"));
    assert.deepEqual(plan.resolution.lingering.events, ["turn-start"]);
    const effect = degree => plan.resolution.outcomes[degree].nativeEffects?.[0];
    assert.deepEqual([effect("failure").outcomeRule.kind, effect("failure").outcomeRule.leaveArea, effect("criticalFailure").outcomeRule.degree], ["area-penalty-effect", true, "criticalFailure"]);
    assert.deepEqual(["success", "failure"].map(d => plan.resolution.outcomes[d].damage.formulas[0].formula), ["2d6[bludgeoning]", "4d6[bludgeoning]"]);
    assert.equal(plan.resolution.outcomes.criticalFailure.noteEffects[0].label, "Pulled down");
    const row = effect("failure").outcomeRule.claimText;
    assert.equal(proveAreaPenalty(effect("failure").document.mechanics.rules, row), true);
    // A different penalty isn't proved.
    assert.equal(proveAreaPenalty(effect("failure").document.mechanics.rules, row.replace("–2", "–3")), false);
});
