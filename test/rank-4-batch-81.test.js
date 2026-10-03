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


// Rank 4, batch 81 (2026-10-02): Shape Stone (the creatures atop the stone: the better of their Reflex save and Acrobatics check; Prone on a failure or
// critical failure; falling off a reminder).

test("Shape Stone: Reflex or Acrobatics, Prone on a failure", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/shape-stone"));
    assert.deepEqual(plan.resolution.check.saveChoice.statistics, ["reflex", "acrobatics"]);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => e.slug)), [[], [], ["prone"], ["prone"]]);
    assert.equal(plan.targeting.actorConstraints.complete, true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.check.saveChoice.statistics = ["reflex", "stealth"];
    assert.ok((inspectSavePlan(bad).blockers ?? []).length > 0);
    // Another check isn't read.
    const other = compile(withText(await spell("rank-4/shape-stone"), html => html.replace("Reflex save or Acrobatics check", "Reflex save or Stealth check")));
    assert.equal(other.compilerEvidence.stoneReshape, undefined);
});
