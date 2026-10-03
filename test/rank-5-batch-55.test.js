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


// Rank 5, batch 55 (2026-10-02): Unravel Existence (the sustained burst's Fortitude rows at the cast and each Sustain; the failing rows' persistent force
// damage and Off-Guard, ending with it, only for a creature the GM says isn't native to the plane; the dust a reminder).

test("Unravel Existence: the rider only on the GM's answer", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, outcomeDamageRollIds } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/unravel-existence"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.sustained], [["sustain"], true]);
    for (const degree of ["failure", "criticalFailure"]) {
        const outcome = plan.resolution.outcomes[degree];
        assert.equal(outcome.damage.formulas[0].gate.kind, "gm-question");
        assert.deepEqual(outcome.effects.map(e => [e.slug, e.gate?.kind, e.endsWhen?.event]), [["off-guard", "gm-question", "persistent-damage-ended"]]);
    }
    assert.ok(plan.resolution.reminders.some(r => /fine dust/.test(r.text)));
    for (const event of ["initial", "sustain"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    // The gated roll counts only on a yes.
    const state = { outcomes: { failure: { damage: { formulas: [{ rollId: "p", gate: { kind: "gm-question" } }, { rollId: "q" }] } } } };
    assert.deepEqual(outcomeDamageRollIds(state, { degree: "failure" }), ["q"]);
    assert.deepEqual(outcomeDamageRollIds(state, { degree: "failure", gateAnswer: { answer: "yes" } }), ["p", "q"]);
    // A gated roll without the row's gated condition is refused.
    const bad = structuredClone(plan); bad.resolution.outcomes.failure.effects[0].gate.question = "Something else?";
    assert.ok((inspectSavePlan(lingeringExposurePlan(bad, { event: "initial" })).blockers ?? []).some(b => /Gated row damage/.test(b.message)));
    // Another qualifier isn't read.
    const other = compile(withText(await spell("rank-5/unravel-existence"), html => html.replace("isn't a native inhabitant", "is a native inhabitant")));
    assert.equal(other.compilerEvidence.realityUnravel, undefined);
});
