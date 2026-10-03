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


// Rank 5, batch 32 (2026-10-02): Flame Strike (8d6 fire, basic Reflex; creatures apply only half their usual fire resistance, and a creature
// immune to fire takes the damage with its result one degree better).

test("Flame Strike: half the fire resistance, and the immune one degree better", async () => {
    const { isResistanceHalving, degreeAdjustmentFor, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/flame-strike"));
    assert.deepEqual(plan.resolution.resistanceHalving.type, "fire");
    assert.deepEqual(plan.resolution.degreeAdjustment.predicate, { kind: "immunity-any", immunities: ["fire"] });
    assert.equal(isResistanceHalving(plan), true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.equal(degreeAdjustmentFor(plan.resolution.degreeAdjustment, { attributes: { immunities: [{ type: "fire" }] } }).status, "applies");
    assert.equal(degreeAdjustmentFor(plan.resolution.degreeAdjustment, { attributes: { immunities: [{ type: "cold" }] } }).status, "not-applicable");
    // Another type than the spell's damage isn't read.
    const other = compile(withText(await spell("rank-5/flame-strike"), html => html.replace("half their usual fire resistance", "half their usual cold resistance")));
    assert.equal(other.resolution.resistanceHalving, undefined);
    // A changed map isn't executable.
    const broken = structuredClone(plan); broken.resolution.degreeAdjustment.map.failure = "failure";
    assert.equal(isResistanceHalving(broken), false);
});
