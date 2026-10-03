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


// Rank 4, batch 136 (2026-10-03): stances with their own Strikes (stance-strike) — Clinging Shadows Stance, Wild Winds Stance.

test("Stances with their own Strikes: the Effect from the text", async () => {
    const shadows = compile(await spell("rank-4/clinging-shadows-stance"));
    assert.equal(shadows.resolution.kind, "stance-strike");
    const [strike, grapple, escape] = shadows.resolution.stanceStrike.rules;
    assert.deepEqual([strike.key, strike.slug, strike.damage.base, strike.group, strike.traits, strike.range], ["Strike", "shadow-grasp", { damageType: "void", dice: 1, die: "d4" }, "brawling", ["agile", "grapple", "reach", "unarmed"], null]);
    assert.deepEqual([grapple.selector, grapple.value, grapple.predicate], ["athletics", 2, ["action:grapple"]]);
    assert.deepEqual([escape.selector, escape.type, escape.value], ["athletics-dc", "circumstance", 2]);
    const winds = compile(await spell("rank-4/wild-winds-stance"));
    assert.equal(winds.resolution.kind, "stance-strike");
    const rules = winds.resolution.stanceStrike.rules;
    assert.deepEqual([rules[0].slug, rules[0].range, rules[0].traits], ["wind-crash", { max: 30 }, ["agile", "nonlethal", "propulsive", "unarmed"]]);
    assert.deepEqual(rules.filter(rule => rule.key !== "Strike").map(rule => rule.key), ["Note", "RollOption", "FlatModifier"]);
    // An unknown Strike trait isn't read.
    const other = compile(withText(await spell("rank-4/wild-winds-stance"), html => html.replace("agile, nonlethal", "agile, versatile p, nonlethal")));
    assert.notEqual(other.resolution.kind, "stance-strike");
});
