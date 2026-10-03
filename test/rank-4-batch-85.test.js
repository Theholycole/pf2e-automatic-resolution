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


// Rank 4, batch 85 (2026-10-02): Captivating Adoration (the caster's emanation, the caster out of it; creatures save when it starts and on entering; a
// failure's Fascinated lasts while in the area, a success's to the end of its next turn; each creature saves once: immune an hour after a success, the
// spell's minute otherwise; exclusions, re-entry, the next-action limit and the attitude are reminders; +15 feet a rank).

test("Captivating Adoration: one save per creature in the aura", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/captivating-adoration"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.excludeCaster, lingering.initial, lingering.events, lingering.areaStep.feet], ["caster", true, true, ["enter"], 15]);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(e => [e.slug, e.endsWhen?.[0]?.event]), [["fascinated", "leave-area"]]);
    assert.deepEqual(plan.resolution.outcomes.success.effects.map(e => [e.slug, e.duration?.expiry]), [["fascinated", "turn-end"]]);
    assert.deepEqual(Object.entries(plan.resolution.temporaryImmunity.byDegree).map(([d, v]) => [d, v.value, v.unit]),
        [["criticalSuccess", 1, "hours"], ["success", 1, "hours"], ["failure", 1, "minutes"], ["criticalFailure", 1, "minutes"]]);
    assert.equal(plan.resolution.reminders.length, 4);
    for (const event of ["initial", "enter"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    // Another re-entry rule isn't read.
    const other = compile(withText(await spell("rank-4/captivating-adoration"), html => html.replace("it uses the results of its original save", "it attempts a new save")));
    assert.equal(other.compilerEvidence.adorationRows, undefined);
});
