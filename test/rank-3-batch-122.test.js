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


// Rank 3, batch 122 (2026-10-03): drinks that cast spells (ritual-degrees) — Fortifying Brew, Winter's Breath.

test("Fortifying Brew: the spells, PF2e's Effect by result, the spoiled brew", async () => {
    const brew = compile(await spell("rank-5/fortifying-brew"));
    assert.equal(brew.resolution.kind, "ritual-degrees");
    const { degrees } = brew.resolution.ritualDegrees;
    const cast = degrees.criticalSuccess.find(action => action.type === "cast");
    assert.deepEqual(cast.spells.map(entry => [entry.name, entry.rank]), [["Cleanse Affliction", 4], ["Clear Mind", 4], ["Sound Body", 4]]);
    assert.deepEqual([cast.who, cast.modifier, cast.choose], ["targets", "primary", undefined]);
    const native = degrees.criticalSuccess.find(action => action.type === "native");
    assert.deepEqual([native.who, native.name, native.selection, native.proof.tempHP, native.proof.bonus, native.proof.seconds], ["targets", "Spell Effect: Fortifying Brew", "critical-success", 20, 2, 43200]);
    assert.deepEqual(native.proof.step, { every: 1, success: 2, criticalSuccess: 4 });
    const plainNative = degrees.success.find(action => action.type === "native");
    assert.deepEqual([plainNative.selection, plainNative.proof.tempHP, plainNative.proof.bonus], ["success", 10, 0]);
    // (The borrowed actions are copies: the success's amendment leaves the critical success alone.)
    assert.equal(native.selection, "critical-success");
    const spoiled = degrees.criticalFailure.find(action => action.type === "condition");
    assert.deepEqual([spoiled.who, spoiled.name, spoiled.value, spoiled.lock, spoiled.seconds], ["primaryAndTargets", "Sickened", 4, true, 43200]);
    // A different bonus isn't read.
    const other = compile(withText(await spell("rank-5/fortifying-brew"), html => html.replace("against diseases and poisons", "against diseases, poisons, and curses")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});

test("Winter's Breath: the spells at the cast rank, the tea's comfort, one choice on a success", async () => {
    const tea = compile(await spell("rank-3/winters-breath"));
    assert.equal(tea.resolution.kind, "ritual-degrees");
    const { degrees } = tea.resolution.ritualDegrees;
    const cast = degrees.criticalSuccess.find(action => action.type === "cast");
    assert.deepEqual(cast.spells.map(entry => [entry.name, entry.rank]), [["Clear Mind", null], ["Environmental Endurance", null], ["Sound Body", null], ["Sure Footing", null]]);
    const comfort = degrees.criticalSuccess.find(action => action.type === "bonus");
    assert.deepEqual(comfort.rules, [{ key: "TempHP", value: 10, step: { every: 1, add: 2, from: 3 } }, { key: "FlatModifier", selector: "saving-throw", type: "status", value: 1, predicate: ["item:trait:emotion"] }]);
    assert.equal(degrees.success.find(action => action.type === "cast").choose, 1);
    assert.deepEqual(degrees.success.find(action => action.type === "bonus").rules.map(rule => rule.key), ["TempHP"]);
    assert.deepEqual(degrees.criticalFailure.find(action => action.type === "condition").value, 3);
    // An unrecognised step isn't read.
    const other = compile(withText(await spell("rank-3/winters-breath"), html => html.replace("are increased by 2.", "are increased by 2, and the bonus by 1.")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
