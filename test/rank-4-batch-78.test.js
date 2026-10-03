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


// Rank 4, batch 78 (2026-10-02): Shared Nightmare (Will: the caster Confused for 1 round on a critical success; the caster's one confused action a
// reminder; the target's first actions a note for 1 minute; the target Confused for 1 minute on a critical failure).

test("Shared Nightmare: the caster's timed Confused, the notes and the target's Confused", async () => {
    const { inspectSavePlan, isCasterConditionTimed } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/shared-nightmare"));
    const caster = plan.resolution.outcomes.criticalSuccess.casterConditions;
    assert.deepEqual(caster.map(c => [c.slug, c.value, c.duration]), [["confused", null, { value: 1, unit: "rounds", expiry: "turn-start" }]]);
    assert.equal(isCasterConditionTimed(plan.resolution.outcomes.criticalSuccess), true);
    assert.equal(isCasterConditionTimed({ ...plan.resolution.outcomes.criticalSuccess, casterConditions: [{ ...caster[0], duration: { ...caster[0].duration, value: 2 } }] }), false);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects.map(n => [n.label, n.duration.value, n.duration.unit]), [["Shared nightmare", 1, "minutes"]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.duration.value, e.duration.unit]), [["confused", 1, "minutes"]]);
    assert.ok(plan.resolution.reminders.some(r => /first action at the start of their next turn/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another caster time isn't read.
    const other = compile(withText(await spell("rank-4/shared-nightmare"), html => html.replace("You are Confused for 1 round.", "You are Confused for 1 minute.")));
    assert.equal(other.compilerEvidence.nightmareSwap, undefined);
});
