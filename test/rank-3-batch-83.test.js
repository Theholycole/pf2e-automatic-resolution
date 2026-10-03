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


// Rank 3, batch 83 (2026-10-03): Impending Doom (each row's immediate conditions applied by the save; the later rounds' conditions a timeline the cast's
// Ongoing record applies as each of the spell's rounds begins; the end's damage, half, full or double, rolled once when the 3 rounds are over).

test("Impending Doom: immediate conditions, a round-by-round timeline and the end's damage", async () => {
    const { isDoomTimeline } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/impending-doom"));
    assert.equal(supported(plan), true);
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(degree => (outcomes[degree].effects ?? []).map(effect => [effect.slug, effect.value ?? null])),
        [[], [], [["off-guard", null]], [["off-guard", null], ["frightened", 3]]]);
    const timeline = plan.resolution.timeline;
    assert.deepEqual(timeline.damage, { dice: 6, faces: 6, type: "mental", perRank: 2, baseRank: 3, sourceText: timeline.damage.sourceText });
    const steps = degree => timeline.byDegree[degree].steps.map(step => [step.round, step.conditions.map(c => `${c.slug}${c.value ?? ""}`).join("+")]);
    assert.deepEqual([steps("success"), steps("failure"), steps("criticalFailure")],
        [[[2, "off-guard"], [3, "frightened1"]], [[2, "frightened2"], [3, "stunned1"]], [[2, "stunned1"], [3, "paralyzed"]]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => timeline.byDegree[degree].multiplier), [0.5, 1, 2]);
    assert.equal(timeline.byDegree.criticalSuccess, undefined);
    assert.equal(plan.resolution.sharedDamage?.components?.length ?? 0, 0);
    const bad = structuredClone(plan); bad.resolution.timeline.byDegree.failure.steps[0].round = 5;
    assert.equal(isDoomTimeline(bad.resolution.timeline, bad), false);
    assert.equal(supported(bad), false);
    // A round past the duration, or another end, isn't read.
    const late = compile(withText(await spell("rank-3/impending-doom"), html => html.replace("On the second round, it becomes stunned 1.", "On the fifth round, it becomes stunned 1.")));
    assert.equal(late.resolution.timeline, undefined);
    const other = compile(withText(await spell("rank-3/impending-doom"), html => html.replace("it takes half damage", "it takes some damage")));
    assert.equal(other.resolution.timeline, undefined);
});
