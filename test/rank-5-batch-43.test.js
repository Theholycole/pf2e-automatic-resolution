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


// Rank 5, batch 43 (2026-10-02): Wish-Twisted Form (Will: PF2e's round Effect on a success, its minute Effect on a failure — and on a critical failure
// preset to its AC penalty — preset to the caster's energy type: weakness at the rank, –10-foot Speeds, –1 saves; the resistance reduction a note).

test("Wish-Twisted Form: PF2e's Effects with the caster's type, and the resistance note", async () => {
    const { inspectSavePlan, executableCasterChoice } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/wish-twisted-form"));
    const rule = d => plan.resolution.outcomes[d].nativeEffects[0].outcomeRule;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [rule(d).kind, rule(d).templateDuration.unit, rule(d).degreeChoice?.value ?? null]),
        [["twisted-form-effect", "rounds", null], ["twisted-form-effect", "minutes", "failure"], ["twisted-form-effect", "minutes", "critical-failure"]]);
    assert.deepEqual(rule("failure").claim, { speed: { type: "status", value: -10 }, saves: { type: "status", value: -1 }, ac: { type: "status", value: -1 }, resistanceReduction: 5 });
    assert.equal(plan.resolution.casterChoice.values.length, 8);
    assert.equal(executableCasterChoice(plan), true);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.rankAmount.base, n.rankAmount.step])),
        [[["Twisted defenses", 5, 1]], [["Twisted defenses", 5, 1]], [["Twisted defenses", 5, 1]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another Speed penalty isn't read (PF2e's Effect wouldn't state it).
    const other = compile(withText(await spell("rank-5/wish-twisted-form"), html => html.replace("–10-foot status penalty", "–15-foot status penalty")));
    assert.equal(other.compilerEvidence.twistedForm, undefined);
});
