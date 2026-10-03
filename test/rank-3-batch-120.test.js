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


// Rank 3, batch 120 (2026-10-03): rituals with choices, bonuses and backlash (ritual-degrees) — Mindscape Door, Astral Projection, Oblivious Expulsion, Garden of
// Death, Call Spirit, Rune Trap.

const kinds = actions => actions.map(action => `${action.type}${action.who ? `:${action.who}` : ""}${action.name ? `:${action.name}` : ""}`);

test("Rituals with choices, bonuses and backlash: the actions", async () => {
    const door = compile(await spell("rank-3/mindscape-door"));
    assert.equal(door.resolution.kind, "ritual-degrees");
    const choice = door.resolution.ritualDegrees.degrees.criticalFailure.find(action => action.type === "choice");
    assert.deepEqual(choice.options.map(option => option.key), ["feedback", "pulled"]);
    const feedback = choice.options[0].actions[0];
    assert.deepEqual([feedback.who, feedback.formula, feedback.damageType, feedback.save, feedback.stepped], ["casters", "9d6", "mental", { statistic: "will", dc: 26, basic: true }, true]);
    assert.deepEqual(door.resolution.ritualDegrees.damageSteps, [{ rank: 8, formula: "20d6", dc: 40 }]);
    const astral = compile(await spell("rank-5/astral-projection"));
    assert.deepEqual(kinds(astral.resolution.ritualDegrees.degrees.criticalFailure.filter(action => action.type !== "note")), ["permanent:casters:Doomed", "knockout:casters"]);
    const cord = astral.resolution.ritualDegrees.degrees.criticalSuccess.find(action => action.type === "bonus");
    assert.ok(cord.toggle);
    assert.deepEqual(cord.rules, [{ key: "FlatModifier", selector: "fortitude", type: "circumstance", value: 4 }]);
    const expel = compile(await spell("rank-5/oblivious-expulsion"));
    assert.deepEqual(expel.resolution.ritualDegrees.degrees.success.filter(action => action.type === "mark").map(action => action.name), ["memories removed"]);
    assert.equal(expel.resolution.ritualDegrees.degrees.criticalFailure[0].seconds, 2592000);
    const garden = compile(await spell("rank-4/garden-of-death"));
    assert.deepEqual(kinds(garden.resolution.ritualDegrees.degrees.criticalSuccess), ["native:casters:Spell Effect: Garden of Death (Critical Success)"]);
    const call = compile(await spell("rank-5/call-spirit"));
    const spirit = call.resolution.ritualDegrees.degrees.criticalSuccess[0];
    assert.deepEqual([spirit.type, spirit.who, spirit.optional, spirit.rules[0].selector, spirit.rules[0].value], ["bonus", "target", true, "deception", -2]);
    const rune = compile(await spell("rank-3/rune-trap"));
    const blast = rune.resolution.ritualDegrees.degrees.criticalFailure[0];
    assert.deepEqual([blast.who, blast.perRank, blast.damageType, blast.save, blast.input], ["castersAndTargets", { dice: 4, faces: 6 }, "force", null, "storedRank"]);
    // An unrecognised rule sentence isn't read.
    const other = compile(withText(await spell("rank-5/call-spirit"), html => html.replace("Deception checks.", "Deception checks and takes 5 damage.")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
