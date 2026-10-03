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


// Rank 3, batch 119 (2026-10-03): rituals from their confirmed result (ritual-degrees) — Rest Eternal, Awaken Portal, Labyrinthine Prison, Reinforced Rations,
// Drain Planar Connection.

const kinds = actions => actions.map(action => `${action.type}${action.who ? `:${action.who}` : ""}${action.name ? `:${action.name}` : ""}`);

test("Rituals from their result: the actions", async () => {
    const rest = compile(await spell("rank-4/rest-eternal"));
    assert.equal(rest.resolution.kind, "ritual-degrees");
    assert.deepEqual(kinds(rest.resolution.ritualDegrees.degrees.criticalFailure), ["condition:casters:Doomed"]);
    assert.equal(rest.resolution.ritualDegrees.degrees.criticalSuccess.find(action => action.type === "mark").rankAbove, 2);
    assert.equal(rest.resolution.ritualDegrees.degrees.success.filter(action => action.type === "mark").length, 1);
    const portal = compile(await spell("rank-3/awaken-portal"));
    assert.deepEqual(kinds(portal.resolution.ritualDegrees.degrees.failure), ["condition:primary:Stupefied"]);
    assert.ok(portal.resolution.ritualDegrees.degrees.success.some(action => action.type === "roll" && action.formula === "1d6"));
    const prison = compile(await spell("rank-3/labyrinthine-prison"));
    assert.deepEqual(kinds(prison.resolution.ritualDegrees.degrees.criticalSuccess), ["mark:target:trapped in the labyrinthine prison", "condition:target:Stupefied"]);
    assert.deepEqual(prison.resolution.ritualDegrees.targetLevels.slice(0, 2), [{ rank: 3, maxLevel: 8 }, { rank: 4, maxLevel: 10 }]);
    const rations = compile(await spell("rank-4/reinforced-rations"));
    const sick = rations.resolution.ritualDegrees.degrees.criticalFailure.find(action => action.type === "condition");
    assert.deepEqual([sick.who, sick.name, sick.value, sick.lock, sick.living, sick.seconds], ["targets", "Sickened", 2, true, true, 86400]);
    const drain = compile(await spell("rank-5/drain-planar-connection"));
    const backlash = drain.resolution.ritualDegrees.degrees.failure.find(action => action.type === "damage");
    assert.deepEqual([backlash.who, backlash.formula, backlash.damageType, backlash.save], ["secondaries", "4d12+26", "force", { statistic: "reflex", dc: 26, basic: true }]);
    assert.ok(drain.resolution.ritualDegrees.degrees.criticalFailure.some(action => action.type === "damage"));
    // An unrecognised rule sentence isn't read.
    const other = compile(withText(await spell("rank-4/rest-eternal"), html => html.replace("for 1 week.", "for 1 week and take 5 damage.")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
