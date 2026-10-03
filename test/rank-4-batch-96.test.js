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


// Rank 4, batch 96 (2026-10-02): Purifying Veil (an area on the Large or smaller target for the minute: Concealed, with the note for those outside; the GM's
// control when it moves through the veil opens its basic Will save against PF2e's 4d6 spirit, +1d6 a rank, and then the spell ends).

test("Purifying Veil: the crossing's save, then the end", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/purifying-veil"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.events, lingering.concealment, lingering.gmAction.endsSpell], ["targets", [], true, true]);
    assert.ok(plan.targeting.actorConstraints.predicates.some(p => p.kind === "size-at-most" && p.size === "lg"));
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan)).blockers ?? [], []);
    const bad = structuredClone(plan); bad.compilerEvidence.purifyingVeil = [];
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-4/purifying-veil"), html => html.replace("If the target leaves the veil, the spell ends.", "")));
    assert.equal(other.compilerEvidence.purifyingVeil, undefined);
});
