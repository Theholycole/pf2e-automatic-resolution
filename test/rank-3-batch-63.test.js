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


// Rank 3, batch 63 (2026-10-02): Noxious Metals (4d6 poison to living creatures, basic Fortitude; plant or wood creatures, or one with an
// anathema toward metal, also take the rows' persistent poison and Sickened while it lasts).

test("Noxious Metals: the second table for the traits or the aversion", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/noxious-metals"));
    const variant = plan.resolution.traitVariant;
    assert.deepEqual([variant.kind, variant.trait, variant.traits, variant.values], ["trait-rows", "metal-anathema", ["plant", "wood"], ["metal-anathema", "other"]]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.multiplier), [0.5, 1, 2]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [variant.outcomes[d].damage.formulas[0].formula, variant.outcomes[d].effects[0].value, variant.outcomes[d].effects[0].endsWhen.event]),
        [["1[persistent,poison]", 1, "persistent-damage-ended"], ["1d4[persistent,poison]", 2, "persistent-damage-ended"], ["1d8[persistent,poison]", 3, "persistent-damage-ended"]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another subject isn't read.
    const other = compile(withText(await spell("rank-3/noxious-metals"), html => html.replace("has an anathema toward metal", "is made of metal")));
    assert.equal(other.resolution.traitVariant, undefined);
});
