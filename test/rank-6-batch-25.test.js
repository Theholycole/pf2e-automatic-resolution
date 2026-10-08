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


// Rank 6, batch 25 (2026-10-05): feature group 14 — things picked up (pickup-cards.js, scripts/pickup-runtime.js): Fire Seeds, Tree of Seasons, Bounty of the Sky.
import { inspectIncarnatePlan } from '../scripts/basic-save-core.js';

const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));
const card = async path => { const plan = compile(await spell(path)); assert.equal(plan.resolution.kind, "incarnate", path); assert.deepEqual(inspectIncarnatePlan(plan), [], path); return plan; };

test("Fire Seeds: four acorns on the caster; each throw's burst save and the burning ground by the fixed Heightened entries", async () => {
    const plan = await card("rank-6/fire-seeds");
    const seed = phasesOf(plan).throw;
    assert.deepEqual([seed.count, seed.range, seed.place, plan.resolution.incarnate.pickup.count, plan.resolution.incarnate.pickup.item], [4, 30, { type: "burst", value: 5 }, 4, "acorn"]);
    assert.equal(seed.plan.resolution.sharedDamage.formula, "(ternary(gte(@item.rank,9),6,ternary(gte(@item.rank,8),5,4)))d6[fire]");
    assert.deepEqual([seed.flames.formula, seed.flames.seconds, seed.flames.events], ["(ternary(gte(@item.rank,9),3,ternary(gte(@item.rank,8),3,2)))d6", 60, ["enter", "turn-end"]]);
});

test("Tree of Seasons and Bounty of the Sky: each season's pod and type; the gift's healing by rank and its conditions", async () => {
    const tree = phasesOf(await card("rank-6/tree-of-seasons"));
    assert.deepEqual(["spring", "summer", "autumn", "winter"].map(season => tree[season].plan.resolution.sharedDamage.formula),
        ["(6 + 1 * (@item.rank - 6))d6[electricity]", "(6 + 1 * (@item.rank - 6))d6[fire]", "(6 + 1 * (@item.rank - 6))d6[poison]", "(6 + 1 * (@item.rank - 6))d6[cold]"]);
    const gift = phasesOf(await card("rank-6/bounty-of-the-sky")).gift;
    assert.deepEqual([gift.radius, gift.heal, gift.conditions, gift.by, gift.eachBy, gift.afflictions],
        [30, "(4 + 2 * floor((@item.rank - 6) / 2))d6", ["clumsy", "drained", "enfeebled", "stupefied"], 2, 1, ["poison", "disease"]]);
});
