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


// Rank 3, batch 124 (2026-10-03): Secure Siege Weapons and Wild Feast (ritual-degrees).

test("Secure Siege Weapons: Hardness and Hit Points by result, the enemies' controls, Broken", async () => {
    const secure = compile(await spell("rank-3/secure-siege-weapons"));
    assert.equal(secure.resolution.kind, "ritual-degrees");
    const { degrees, area } = secure.resolution.ritualDegrees;
    const critical = degrees.criticalSuccess.find(action => action.type === "fortify");
    assert.deepEqual([critical.who, critical.hardness, critical.hpPerLevel, critical.seconds, critical.siege], ["targets", 10, 3, 2592000, { commandeer: { statistic: "will", dc: 20 }, launch: true }]);
    const success = degrees.success.find(action => action.type === "fortify");
    assert.deepEqual([success.hardness, success.hpPerLevel], [5, 2]);
    assert.deepEqual(degrees.criticalFailure, [{ type: "permanent", who: "targets", name: "Broken", value: null }]);
    assert.deepEqual(area, { type: "burst", value: 250, doubleEvery: null });
    const other = compile(withText(await spell("rank-3/secure-siege-weapons"), html => html.replace("Hardness increases by 10,", "Hardness increases by 10 and its AC by 2,")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});

test("Wild Feast: the penalty, the companions' daily check, the curse, the area", async () => {
    const feast = compile(await spell("rank-4/wild-feast"));
    assert.equal(feast.resolution.kind, "ritual-degrees");
    const { degrees, area } = feast.resolution.ritualDegrees;
    const hostility = degrees.success.find(action => action.type === "bonus");
    assert.deepEqual([hostility.who, hostility.seconds, hostility.rules[0].value, hostility.rules[0].predicate],
        ["targets", 259200, -2, [{ or: ["action:command-an-animal", "action:demoralize"] }, { or: ["target:trait:animal", "target:trait:fungus", "target:trait:plant"] }]]);
    assert.deepEqual(degrees.criticalSuccess.find(action => action.type === "companions").skills, ["diplomacy", "nature"]);
    assert.equal(degrees.criticalFailure.find(action => action.type === "mark").who, "casters");
    assert.deepEqual(area, { type: "burst", value: 500, doubleEvery: 2 });
    const other = compile(withText(await spell("rank-4/wild-feast"), html => html.replace("take a –2 status penalty", "take a –2 status penalty and 1 damage")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
