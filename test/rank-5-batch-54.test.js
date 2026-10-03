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


// Rank 5, batch 54 (2026-10-02): Mirror Malefactors (Will, sustained, the target: 7d8 mental at the cast and on each round's first Sustain; Frightened 1 held
// while the spell lasts; a critical success ends it; no reflection or too large a reminder).

test("Mirror Malefactors: the sustained target's saves, held Frightened, and the critical success's end", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/mirror-malefactors"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.centre, plan.resolution.lingering.memberCondition.slug, plan.resolution.lingering.memberCondition.value, plan.resolution.lingering.memberCondition.locked], [["sustain"], "targets", "frightened", 1, true]);
    assert.deepEqual([plan.resolution.outcomes.criticalSuccess.endsSpell, plan.resolution.outcomes.criticalSuccess.endsSpellOn], [true, "critical-success"]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "sustain" })).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.outcomes.failure.endsSpell = true; bad.resolution.outcomes.failure.endsSpellOn = "critical-success";
    assert.ok((inspectSavePlan(lingeringExposurePlan(bad, { event: "sustain" })).blockers ?? []).length > 0);
    // Another end rule isn't read.
    const other = compile(withText(await spell("rank-5/mirror-malefactors"), html => html.replace("critically succeeds at any Will save", "succeeds at any Will save")));
    assert.equal(other.compilerEvidence.mirrorRing, undefined);
});
