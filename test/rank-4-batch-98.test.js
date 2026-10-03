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


// Rank 4, batch 98 (2026-10-02): Overflowing Sorrow (the caster's sustained emanation; each creature saves once on entering or starting its turn inside; the
// success's –1 to skill and Perception checks PF2e's modifier, the failing rows' rules notes, each lasting while the creature is inside; re-entry a reminder).

test("Overflowing Sorrow: notes that last while inside", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/overflowing-sorrow"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.excludeCaster, lingering.events.sort()], ["caster", true, ["enter", "turn-start"]]);
    const success = plan.resolution.outcomes.success.noteEffects[0];
    assert.deepEqual([success.whileInArea, success.rules[0].selector, success.rules[0].value], [true, ["skill-check", "perception"], -1]);
    assert.ok(["failure", "criticalFailure"].every(d => plan.resolution.outcomes[d].noteEffects[0].whileInArea === true));
    assert.equal(plan.resolution.temporaryImmunity.degrees.length, 4);
    for (const event of ["enter", "turn-start"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    assert.equal(validNoteEffect({ ...success, duration: { mode: "fixed", value: 1, unit: "minutes" } }), false);
    const other = compile(withText(await spell("rank-4/overflowing-sorrow"), html => html.replace("uses the same effect as before", "attempts a new save")));
    assert.equal(other.compilerEvidence.sorrowAura, undefined);
});
