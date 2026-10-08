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


// Rank 8, batch 7 (2026-10-03): Divine Aura.
import { isExecutableLingeringPlan as auraReady } from "../scripts/basic-save-core.js";

test("Divine Aura: the caster's growing emanation; allies inside hold +1 status to AC and saves (toggles: +2, +4); the GM's melee-hit control opens a Will save against Blinded, then immunity", async () => {
    const plan = compile(await spell("rank-8/divine-aura"));
    assert.equal(auraReady(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.memberAllies, lingering.events, lingering.initial, lingering.sustainGrowth.feet, lingering.sustainGrowth.optional], ["caster", true, [], false, 10, false]);
    const values = lingering.memberRules.filter(rule => rule.key === "FlatModifier").map(rule => `${rule.selector}:${rule.value}:${rule.predicate?.[0] ?? ""}`);
    assert.deepEqual(values, ["ac:1:", "saving-throw:1:", "ac:2:divine-aura-opposed", "saving-throw:2:divine-aura-opposed", "ac:4:divine-aura-controlled", "saving-throw:4:divine-aura-controlled"]);
    assert.equal(new Set(lingering.memberRules.filter(rule => rule.key === "FlatModifier").map(rule => rule.slug)).size, 6);
    assert.equal(plan.resolution.check.statistic ?? plan.resolution.check.save ?? "will", "will");
    assert.deepEqual(["failure", "criticalFailure"].map(degree => plan.resolution.outcomes[degree].effects.map(effect => effect.slug).join()), ["blinded", "blinded"]);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "minutes" });
    assert.equal(lingering.gmAction.actions[0], "hit");
});
