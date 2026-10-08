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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 6, batch 3 (2026-10-03): Desiccate, Unfolding Wind Crash, Devouring Void, Field of Life, Stone to Flesh, Hasted Assault, Skeleton Army.

test("Desiccate: living targets, water and plant creatures one degree worse, the moisture question", async () => {
    const plan = compile(await spell("rank-8/desiccate"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ["living-creature", "gm-confirmed"]);
    assert.ok(plan.resolution.degreeAdjustment);
});

test("Unfolding Wind Crash: the jump's reminder, a 20-foot emanation, Prone on a critical failure", async () => {
    const plan = compile(await spell("rank-9/unfolding-wind-crash"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.targeting.area, { type: "emanation", value: 20 });
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "caster-movement"));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["prone"]);
});

test("Devouring Void: a placed sustained area, only the living exposed", async () => {
    const { lingering } = compile(await spell("rank-7/devouring-void")).resolution;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained, lingering.livingOnly], [["sustain"], true, true, true]);
});

test("Field of Life: the living healed and the undead harmed as each turn starts, the fixed heightened dice", async () => {
    const plan = compile(await spell("rank-6/field-of-life"));
    assert.equal(plan.resolution.kind, "hazard-area");
    assert.deepEqual(plan.resolution.hazardArea.control, { kind: "life-field", formula: "1d8", type: "vitality", fixed: { 8: "1d10", 9: "1d12" } });
});

test("Stone to Flesh: Petrified ended on the target", async () => {
    const plan = compile(await spell("rank-6/stone-to-flesh"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.restoreCondition.slug], ["restore-condition", "petrified"]);
});

test("Hasted Assault: the caster Quickened for 1 minute", async () => {
    const plan = compile(await spell("rank-7/hasted-assault"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug, plan.resolution.conditionNote.duration.value], ["condition-note", "source", "quickened", 1]);
});

test("Skeleton Army: each phase rolls the text's damage", async () => {
    const plan = compile(await spell("rank-6/skeleton-army"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(plan.resolution.incarnate.phases.map(phase => phase.plan.resolution.sharedDamage.formula), ["4d8[slashing]", "6d6[piercing]"]);
    assert.ok(plan.resolution.incarnate.phases.every(phase => supported(phase.plan)));
});
