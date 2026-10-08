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


// Rank 8, batch 14 (2026-10-05): feature group 3, part 2 — Whirlpool, Whirlwind, Tear the Veil, Stars of Another Sky: lingering areas whose rows
// move creatures (toward or to the center, up into the air), with a living-only terrain and draining centre, and the GM's mark for the top of the sky.
import { isExecutableLingeringPlan } from "../scripts/basic-save-core.js";

test("Whirlpool: cast and Sustain exposures, terrain, the pulls (10 feet; to the center)", async () => {
    const plan = compile(await spell("rank-8/whirlpool"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.sustained, lingering.terrain?.difficulty], [true, ["sustain"], true, 2]);
    assert.deepEqual([plan.resolution.outcomes.failure.forcedMovement.distance, plan.resolution.outcomes.criticalFailure.forcedMovement.toCenter], [10, true]);
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.multiplier, 2);
    assert.ok(lingering.notes.some(note => /Swim DC is your spell DC/.test(note)));
});

test("Whirlwind: cast and each Sustain, the moved-through control, rises of 10 and 20 feet with the fly note", async () => {
    const plan = compile(await spell("rank-8/whirlwind"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual(plan.resolution.lingering.gmAction.actions, ["pass"]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].forcedMovement.kind, plan.resolution.outcomes[d].forcedMovement.distance]), [["rise", 10], ["rise", 20]]);
    assert.ok(/fly Speed/.test(plan.resolution.outcomes.failure.noteEffects.at(-1).text));
    // (A rise the row doesn't state is refused.)
    const forged = structuredClone(plan); forged.resolution.outcomes.failure.forcedMovement.distance = 15;
    assert.equal(isExecutableLingeringPlan(forged), false);
});

test("Tear the Veil: living only, per-row void damage and pulls, terrain for the living, the draining centre", async () => {
    const plan = compile(await spell("rank-10/tear-the-veil"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.livingOnly, lingering.terrain.living, lingering.drainCenter.radius, lingering.drainCenter.max, lingering.drainCenter.becomes], [true, true, 5, 4, "wraith"]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].damage.formulas[0].formula, plan.resolution.outcomes[d].forcedMovement.distance]),
        [["5d12[void]", 15], ["10d12[void]", 30], ["20d12[void]", 30]]);
    assert.ok(plan.targeting.actorConstraints.predicates.some(p => p.kind === "living-creature"));
});

test("Stars of Another Sky: Fascinated while the spell lasts, rises, 1-day immunity, the failure's note, the top's mark", async () => {
    const plan = compile(await spell("rank-8/stars-of-another-sky"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "days" });
    for (const [degree, feet] of [["success", 20], ["failure", 50], ["criticalFailure", 100]]) {
        assert.equal(plan.resolution.outcomes[degree].forcedMovement.distance, feet);
        assert.deepEqual(plan.resolution.outcomes[degree].effects[0].endsWhen, [{ event: "area-ended" }]);
    }
    assert.equal(plan.resolution.outcomes.failure.noteEffects.at(-1).label, "Rapt");
    assert.deepEqual([plan.resolution.lingering.gmMark.dice, plan.resolution.lingering.gmMark.type, plan.resolution.lingering.gmMark.diesAtZero], ["5d10", "mental", true]);
});
