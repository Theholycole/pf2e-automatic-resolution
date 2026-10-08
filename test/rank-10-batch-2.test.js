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


// Rank 10, batch 2 (2026-10-05): feature group 3, part 3 — Pied Piping (the save-once aura whose rows last for the spell, immunity, minion control),
// Flesh Tsunami (a card of parts: thralls, a placed cone of greater difficult terrain, the grasp's save), Shadow Army (the caster's condition and the
// critical success's better saves), Vacuum (holding breath, the GM's control, suffocation).
import { isExecutableLingeringPlan, inspectIncarnatePlan } from "../scripts/basic-save-core.js";

test("Pied Piping: rows held outside the area, a day's immunity, the critical failure's controlled minion, a growing Sustain", async () => {
    const plan = compile(await spell("rank-10/pied-piping"));
    assert.equal(plan.resolution.kind, "lantern-aura");
    const aura = plan.resolution.lanternAura;
    assert.deepEqual([aura.heldOutside, aura.immunity, aura.growth, aura.dismissible, aura.radiusDefault], [true, { value: 1, unit: "days" }, { feet: 5 }, true, 60]);
    assert.deepEqual([aura.rows.criticalFailure.minion, aura.rows.criticalFailure.conditions[0].slug, aura.rows.failure.conditions[0].slug], [true, "controlled", "fascinated"]);
});

test("Flesh Tsunami: destroy, terrain (greater, a 60-foot cone, 1 minute), a second thrall, the grasp's save", async () => {
    const plan = compile(await spell("rank-8/flesh-tsunami"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [thrall, wave, second, grasp] = plan.resolution.incarnate.phases;
    assert.deepEqual([thrall.kind, wave.kind, wave.place, wave.difficulty, wave.rounds, second.kind, grasp.kind], ["destroy-thrall", "terrain", { type: "cone", value: 60 }, 3, 10, "destroy-thrall", "save"]);
    assert.equal(grasp.plan.resolution.outcomes.failure.effects[0].slug, "immobilized");
});

test("Shadow Army: enemies when cast and at turn end, the caster's condition, better saves after a critical success", async () => {
    const plan = compile(await spell("rank-10/shadow-army"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.enemiesOnly, plan.resolution.lingering.initial, plan.resolution.lingering.events], [true, true, ["turn-end"]]);
    assert.deepEqual(plan.resolution.casterChoice.values, ["clumsy", "enfeebled", "off-guard", "slowed"]);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.filter(e => e.choiceGroup === "caster-condition").map(e => e.slug), ["clumsy", "enfeebled", "off-guard", "slowed"]);
    assert.deepEqual(plan.resolution.degreeAdjustment.predicate, { kind: "note-held", label: "Sees through the shadows" });
});

test("Vacuum: cast, entering and Sustain exposures; holding breath improves later saves; suffocation on a critical failure", async () => {
    const plan = compile(await spell("rank-7/vacuum"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.initial, [...plan.resolution.lingering.events].sort(), plan.resolution.lingering.gmAction.actions], [true, ["enter", "sustain"], ["breathe"]]);
    assert.equal(plan.resolution.outcomes.failure.effects[0].slug, "stunned");
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["unconscious"]);
    assert.equal(plan.resolution.degreeAdjustment.predicate.label, "Holding its breath");
});
