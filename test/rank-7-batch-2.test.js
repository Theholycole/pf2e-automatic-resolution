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


// Rank 7, batch 2 (2026-10-03): Clockwork Devotion, Sudden Transposition, Frigid Flurry, Accelerated Decomposition, Momentary Recovery, Hypnopompic Terrors, Eclipse Burst.

test("Clockwork Devotion: each phase rolls the text's damage, two types on Depart", async () => {
    const plan = compile(await spell("rank-8/clockwork-devotion"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(plan.resolution.incarnate.phases.map(phase => phase.plan.resolution.sharedDamage.formula), ["4d10[slashing]", "{4d8[slashing],4d8[fire]}"]);
    assert.ok(plan.resolution.incarnate.phases.every(phase => supported(phase.plan)));
});

test("Sudden Transposition: full damage, double and Prone, the teleport reminder", async () => {
    const plan = compile(await spell("rank-8/sudden-transposition"));
    assert.ok(supported(plan));
    assert.deepEqual([plan.resolution.outcomes.failure.damage.multiplier, plan.resolution.outcomes.criticalFailure.damage.multiplier], [1, 2]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["prone"]);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "teleport"));
});

test("Frigid Flurry: enemies only, the carry reminder", async () => {
    const plan = compile(await spell("rank-7/frigid-flurry"));
    assert.ok(supported(plan));
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === "enemy-of-caster"));
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "caster-movement"));
});

test("Accelerated Decomposition: the success row's conditions are the caster's pick", async () => {
    const plan = compile(await spell("rank-6/accelerated-decomposition"));
    assert.ok(supported(plan));
    assert.deepEqual([plan.resolution.casterChoice.pick, plan.resolution.casterChoice.rows, plan.resolution.casterChoice.values], ["row-condition", ["success"], ["clumsy", "drained", "enfeebled"]]);
    assert.ok(plan.resolution.outcomes.failure.effects.every(effect => effect.choiceGroup == null));
});

test("Momentary Recovery: the caster Slowed 1 until the end of their next turn", async () => {
    const plan = compile(await spell("rank-7/momentary-recovery"));
    assert.deepEqual([plan.resolution.kind, plan.resolution.conditionNote.condition.slug, plan.resolution.conditionNote.condition.value], ["condition-note", "slowed", 1]);
});

test("Hypnopompic Terrors: a sleeping target one step worse; the critical failure's Paralyzed for 2 rounds", async () => {
    const plan = compile(await spell("rank-8/hypnopompic-terrors"));
    assert.ok(supported(plan));
    assert.equal(plan.resolution.degreeAdjustment.predicate.kind, "gm-confirmed");
    const paralyzed = plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === "paralyzed");
    assert.deepEqual([paralyzed.duration.value, paralyzed.duration.unit], [2, "rounds"]);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier, 2);
});

test("Eclipse Burst: cold and void together, Blinded on a critical failure", async () => {
    const plan = compile(await spell("rank-7/eclipse-burst"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["blinded"]);
});
