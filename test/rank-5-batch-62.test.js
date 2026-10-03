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


// Rank 5, batch 62 (2026-10-03): Pressure Zone (the placed burst's saves for living creatures; the failure's end-of-turn save only outside the zone; the
// deafened condition's own 1-action save on each row; immune for an hour after any result; anatomy immunity a GM reminder).

test("Pressure Zone: an outside-only end-of-turn save, a condition's own action save", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, isRecurringSaveLifetime, isConditionActionSave } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/pressure-zone"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    for (const event of ["initial", "enter"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === "living-creature"));
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "hours" });
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => outcomes[degree].effects.map(effect => `${effect.slug}${effect.value ?? ""}${effect.actionSave ? "*" : ""}${effect.recurringSave ? "^" : ""}`).join("+")),
        ["deafened*+clumsy1", "deafened*^+clumsy2^", "deafened*+clumsy2"]);
    assert.deepEqual(outcomes.failure.effects[0].recurringSave.outsideArea, true);
    assert.equal(isRecurringSaveLifetime(outcomes.failure.effects[0]), true);
    const bad = structuredClone(outcomes.failure.effects[0]); bad.recurringSave.mode = "reduce";
    assert.equal(isRecurringSaveLifetime(bad), false);
    assert.equal(isConditionActionSave({ actionSave: { statistic: "luck", sourceText: "x" } }), false);
    assert.ok(plan.resolution.reminders.some(reminder => /anatomies/.test(reminder.text)));
    // A save that isn't tied to leaving the zone isn't read.
    const other = compile(withText(await spell("rank-5/pressure-zone"), html => html.replace(" if it's no longer in the pressure zone", "")));
    assert.equal(other.compilerEvidence.pressureZone, undefined);
});
