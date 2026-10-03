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


// Rank 6, batch 2 (2026-10-03): Poltergeist's Fury, Phantom Orchestra, Frozen Fog.

test("Poltergeist's Fury: an ally's success a critical success, the caster's lesser cover", async () => {
    const plan = compile(await spell("rank-6/poltergeists-fury"));
    assert.ok(supported(plan));
    assert.deepEqual([plan.resolution.degreeAdjustment.predicate.kind, plan.resolution.degreeAdjustment.map.success], ["ally-of-caster", "criticalSuccess"]);
    assert.deepEqual(plan.resolution.casterStorm.rules, [{ key: "FlatModifier", selector: "ac", type: "circumstance", value: 1, label: "Lesser cover (the storm)" }]);
});

test("Phantom Orchestra: a burst on the cast and each Sustain", async () => {
    const { lingering } = compile(await spell("rank-6/phantom-orchestra")).resolution;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained, lingering.area.value], [["sustain"], true, true, 10]);
});

test("Frozen Fog: concealment, the turn-start save, Clumsy and the Speed penalty", async () => {
    const plan = compile(await spell("rank-6/frozen-fog"));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.concealment], [["turn-start"], true]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]), [["clumsy", 2]]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].rules[0].value, -10);
});
