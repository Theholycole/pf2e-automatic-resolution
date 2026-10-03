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


// Rank 4, batch 90 (2026-10-02): Ymeri's Mark (the duration's Fortitude save; Fatigued held for the row's time — 1 minute, 7 days or unlimited; a note whose
// controls Dismiss the spell to detonate it — a basic Reflex card of PF2e's damage for the creatures within 10 feet, the marked one too or not).

test("Ymeri's Mark: the held Fatigued and the detonation", async () => {
    const { detonationPlan, isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/ymeris-mark"));
    assert.deepEqual([plan.resolution.check.statistic, plan.resolution.check.basic], ["fortitude", false]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.locked, e.duration?.value ?? null, e.duration?.unit ?? null])),
        [[["fatigued", true, 1, "minutes"]], [["fatigued", true, 7, "days"]], [["fatigued", true, null, null]]]);
    const td = plan.resolution.outcomes.failure.noteEffects[0].triggeredDamage;
    assert.deepEqual([td.trigger, td.emanation, td.dice, td.die, td.type, td.heightening.dice], ["detonate", 10, 5, 6, "fire", 2]);
    const boom = detonationPlan(plan);
    assert.deepEqual([boom.resolution.check.statistic, boom.resolution.check.basic, boom.targeting.area.value], ["reflex", true, 10]);
    assert.equal(inspectSavePlan(boom).supported, true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.equal(isTriggeredDamage({ ...td, emanation: 7 }), false);
    const other = compile(withText(await spell("rank-4/ymeris-mark"), html => html.replace("You choose whether the mark's target is included in the explosion.", "")));
    assert.equal(other.compilerEvidence.detonatingMark, undefined);
});
