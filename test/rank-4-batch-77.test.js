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


// Rank 4, batch 77 (2026-10-02): Luring Wail (Will, a sustained 60-foot emanation: creatures in it at the cast or entering save; the named creature's
// –2 the GM's answer; Slowed 1 for 1 round; Fascinated — and Off-Guard on a critical failure — until it leaves the area, the compulsion a Lured note
// while fascinated; hearing the GM's review).

test("Luring Wail: the lingering area's saves, Fascinated until it leaves, the Lured note", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/luring-wail"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.sustained], [["enter"], true, true]);
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(c => c.value), [-2, 0]);
    const ends = d => plan.resolution.outcomes[d].effects.map(e => [e.slug, JSON.stringify(e.endsWhen ?? null)]);
    assert.deepEqual(ends("failure"), [["fascinated", '[{"event":"leave-area"}]']]);
    assert.deepEqual(ends("criticalFailure"), [["fascinated", '[{"event":"leave-area"}]'], ["off-guard", '[{"event":"leave-area"}]']]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.whileCondition])), [[["Lured", "fascinated"]], [["Lured", "fascinated"]]]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "enter" })).blockers ?? [], []);
    // Another compulsion isn't read.
    const other = compile(withText(await spell("rank-4/luring-wail"), html => html.replace("spend all its actions", "spend two actions")));
    assert.equal(other.compilerEvidence.luringRows, undefined);
});
