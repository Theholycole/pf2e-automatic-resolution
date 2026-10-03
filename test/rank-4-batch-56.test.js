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


// Rank 4, batch 56 (2026-10-02): Dreamer's Call (Will: Fascinated until the end of the target's next turn; on the failing rows the caster's pick
// of approach / flee (Fleeing) / release / Drop Prone (Prone); a critical failure's every action a note).

test("Dreamer's Call: the course of action the caster picks", async () => {
    const { inspectSavePlan, executableCasterChoice } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/dreamers-call"));
    assert.deepEqual([plan.resolution.casterChoice.kind, plan.resolution.casterChoice.values, plan.resolution.casterChoice.rows], ["option", ["approach", "flee", "release", "prone"], ["failure", "criticalFailure"]]);
    const tagged = d => [...plan.resolution.outcomes[d].effects, ...(plan.resolution.outcomes[d].noteEffects ?? [])].filter(e => e.choiceGroup === "caster-option").map(e => e.option).sort();
    assert.deepEqual([tagged("failure"), tagged("criticalFailure"), tagged("success")], [["approach", "flee", "prone", "release"], ["approach", "flee", "prone", "release"], []]);
    assert.equal(plan.resolution.outcomes.success.effects[0].duration.expiry, "turn-end");
    assert.equal(executableCasterChoice(plan), true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another list isn't read.
    const other = compile(withText(await spell("rank-4/dreamers-call"), html => html.replace("or Drop Prone in obeisance", "or dance")));
    assert.equal(other.resolution.casterChoice, undefined);
});
