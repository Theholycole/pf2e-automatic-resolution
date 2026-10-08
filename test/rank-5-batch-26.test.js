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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 5, batch 26 (2026-10-02): Elemental Breath (each PF2e element variant reads its own list item: the basic Reflex save of its damage; Air's
// push and Earth's Prone on the failing rows; Metal's worse result for metal creatures; Wood's terrain placed from the card; Water's and Wood's
// heightened dice split by the caster).

const mergeDeep = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value)
    && target[key] && typeof target[key] === 'object' ? mergeDeep(target[key], value) : structuredClone(value); return target; };
const element = (source, name) => {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.name === `Elemental Breath (${name})`);
    const item = structuredClone(source); item.system = mergeDeep(item.system, structuredClone(overlay.system)); delete item.system.overlays;
    for (const entry of Object.values(item.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ["damage"];
    return item;
};

test("Elemental Breath: each element's variant", async () => {
    const source = await spell("rank-5/elemental-breath");
    const plans = Object.fromEntries(["Air", "Earth", "Fire", "Metal", "Water", "Wood"].map(name => [name, compile(element(source, name))]));
    for (const [name, plan] of Object.entries(plans)) assert.deepEqual(inspectSavePlan(plan).blockers, [], name);
    assert.equal(plans.Air.resolution.outcomes.failure.forcedMovement.distance, 10);
    assert.equal(plans.Air.resolution.outcomes.success.forcedMovement, undefined);
    assert.deepEqual(plans.Earth.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["prone"]);
    assert.deepEqual(plans.Metal.resolution.degreeAdjustment.predicate, { kind: "trait-any", traits: ["metal"] });
    assert.deepEqual([plans.Water.resolution.sharedDamage.diceSplit.from, plans.Water.resolution.sharedDamage.diceSplit.to], ["cold", "bludgeoning"]);
    assert.equal(plans.Wood.resolution.areaTerrain.durationSeconds, 60);
    assert.equal(plans.Fire.resolution.areaTerrain, undefined);
    // A split between types the variant doesn't have is blocked.
    const broken = structuredClone(plans.Water); broken.resolution.sharedDamage.diceSplit.to = "fire";
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
    // A variant whose data isn't its item's damage isn't read.
    const other = element(source, "Fire"); Object.values(other.system.damage)[0].formula = "6d10";
    assert.equal(compile(other).compilerEvidence.elementVariant, undefined);
});
