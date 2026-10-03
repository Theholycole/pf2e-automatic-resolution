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


// Rank 4, batch 99 (2026-10-02): Morass of Ages (the caster's sustained 5-foot emanation; each creature saves once; the difficult terrain a note while inside; a
// failure's Slowed 1 granted while inside; a critical failure's Restrained until it Escapes; the optional 5-foot growth to 60 after each Sustain).

test("Morass of Ages: in-area slowing, the escape and the growth", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, isOptionalExpansion } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/morass-of-ages"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.excludeCaster, lingering.sustainGrowth], ["caster", true, { feet: 5, optional: true, maximum: 60, sourceText: lingering.sustainGrowth.sourceText }]);
    assert.equal(isOptionalExpansion(lingering), true);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects[0].rules.map(r => [r.key, r.alterations[0].value]), [["GrantItem", 1]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.endsWhen?.[0]?.event]), [["restrained", "escape"]]);
    for (const event of ["initial", "enter"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.lingering.sustainGrowth.maximum = 5;
    assert.equal(isOptionalExpansion(bad.resolution.lingering), false);
    const other = compile(withText(await spell("rank-4/morass-of-ages"), html => html.replace("to a maximum of 60 feet", "with no maximum")));
    assert.equal(other.compilerEvidence.timeMorass, undefined);
});
