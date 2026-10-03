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


// Rank 3, batch 87 (2026-10-03): Ring of Truth (the placed burst's saves, once per creature; each result a note while the creature is in the area — the
// bell's behaviour for it and the area's –2 status penalty to Deception; re-entry a reminder).

test("Ring of Truth: one save per creature, notes with the Deception penalty while inside", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/ring-of-truth"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    for (const event of ["initial", "enter"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 10, unit: "minutes" });
    for (const degree of ["criticalSuccess", "success", "failure", "criticalFailure"]) {
        const note = plan.resolution.outcomes[degree].noteEffects.find(entry => entry.label === "Ring of truth");
        assert.equal(note.whileInArea, true);
        assert.deepEqual(note.rules, [{ key: "FlatModifier", selector: "deception", type: "status", value: -2 }]);
    }
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /never ring if they lie/);
    // A penalty to something that isn't a skill, or a rule among the bell's behaviour, isn't read.
    const other = compile(withText(await spell("rank-3/ring-of-truth"), html => html.replace("to Deception checks", "to Wisdom checks")));
    assert.equal(other.compilerEvidence.truthRing, undefined);
    const ruled = compile(withText(await spell("rank-3/ring-of-truth"), html => html.replace("the soft ring of a bell sounds in the area", "the creature takes 1d6 sonic damage")));
    assert.equal(ruled.compilerEvidence.truthRing, undefined);
});
