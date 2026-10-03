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


// Rank 3, batch 125 (2026-10-03): Loyalty's Ward and Footholds and Foothills (ritual-degrees).

test("Loyalty's Ward: the criteria, the save to leave, the wait by result, the inverted backfire", async () => {
    const ward = compile(await spell("rank-5/loyaltys-ward"));
    assert.equal(ward.resolution.kind, "ritual-degrees");
    const { degrees } = ward.resolution.ritualDegrees;
    const critical = degrees.criticalSuccess.find(action => action.type === "ward");
    assert.deepEqual([critical.statistic, critical.retrySeconds, critical.inverted, critical.seconds, critical.criteria.length], ["will", 86400, false, 604800, 4]);
    assert.equal(degrees.success.find(action => action.type === "ward").retrySeconds, 3600);
    assert.equal(critical.retrySeconds, 86400);
    assert.deepEqual([degrees.criticalFailure[0].type, degrees.criticalFailure[0].inverted], ["ward", true]);
    const other = compile(withText(await spell("rank-5/loyaltys-ward"), html => html.replace("for 24 hours.", "for 24 hours, and take 2d6 damage.")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});

test("Footholds and Foothills: the options, the duration or permanence, the area's growth, the backfire", async () => {
    const footholds = compile(await spell("rank-5/footholds-and-foothills"));
    assert.equal(footholds.resolution.kind, "ritual-degrees");
    const { degrees, area } = footholds.resolution.ritualDegrees;
    const permanent = degrees.criticalSuccess[0];
    assert.deepEqual([permanent.type, permanent.seconds, permanent.options, permanent.crater, Object.keys(permanent.notes)], ["terrain", 0, ["add", "remove", "roughen", "smooth"], 30, ["add", "remove", "roughen", "smooth"]]);
    assert.equal(degrees.success[0].seconds, 604800);
    assert.deepEqual([degrees.criticalFailure.find(action => action.type === "mark").who, degrees.criticalFailure.find(action => action.type === "mark").seconds], ["primary", 604800]);
    assert.deepEqual(area, { type: "burst", value: 30, doubleEvery: null, addEvery: { step: 1, feet: 20 } });
    const other = compile(withText(await spell("rank-5/footholds-and-foothills"), html => html.replace("30-foot-deep crater", "30-foot-deep crater dealing 4d6 damage")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
