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


// Rank 4, batch 54 (2026-10-02): Coral Eruption (two 10-foot bursts: 6d6 piercing, basic Reflex, a critical failure also 1d6 persistent bleed;
// the bursts are difficult and hazardous terrain for 1 minute, (floor(rank/2) + 1) piercing for each square a creature moves into).

test("Coral Eruption: the reef the card places", async () => {
    const { isReefTerrain, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/coral-eruption"));
    const terrain = plan.resolution.areaTerrain;
    assert.deepEqual([terrain.durationSeconds, terrain.count, terrain.gmHazard.kind, terrain.gmHazard.formula, terrain.gmHazard.type, terrain.notes.length], [60, 2, "per-square", "(floor(@item.rank/2)+1)", "piercing", 1]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.damage.formulas.map(f => f.formula), ["1d6[persistent,bleed]"]);
    assert.equal(isReefTerrain(plan), true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const broken = structuredClone(plan); broken.resolution.areaTerrain.gmHazard.formula = "@actor.level";
    assert.equal(isReefTerrain(broken), false);
    // Another hazard isn't read.
    const other = compile(withText(await spell("rank-4/coral-eruption"), html => html.replace("for every square of that area it moves into", "once")));
    assert.equal(other.resolution.areaTerrain, undefined);
});
