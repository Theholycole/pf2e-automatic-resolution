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


// Rank 4, batch 63 (2026-10-02): Bestial Curse (Fortitude: success Clumsy 1 for 1 round; failure for 1 hour Clumsy 1, PF2e's weakness Effect, a
// bestial Strike and the flat check on manipulate actions as notes; critical failure the same, unlimited).

test("Bestial Curse: the clumsy rows and the weakness Effects", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/bestial-curse"));
    const rows = d => plan.resolution.outcomes[d];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => rows(d).effects.map(e => [e.slug, e.value, e.duration?.unit ?? null])), [[["clumsy", 1, "rounds"]], [["clumsy", 1, "hours"]], [["clumsy", 1, null]]]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => [rows(d).nativeEffects.map(e => [e.outcomeRule.kind, e.document.mechanics.duration.unit]), rows(d).noteEffects.map(n => n.label)]),
        [[[["weakness-curse-effect", "hours"]], ["Bestial Strike", "Clumsy claws"]], [[["weakness-curse-effect", "unlimited"]], ["Bestial Strike", "Clumsy claws"]]]);
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another weakness isn't read.
    const other = compile(withText(await spell("rank-4/bestial-curse"), html => html.replace("weakness 1 to silver", "weakness 1 to cold iron")));
    assert.equal(other.compilerEvidence.bestialRows, undefined);
});
