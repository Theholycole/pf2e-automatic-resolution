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


// Rank 8, batch 1 (2026-10-03): rank 6–10 rituals — Binding Circle, Separation, Freedom, Imprisonment, Sleepless Season, Void Harvest, Awaken Curse.

const degrees = async slug => compile(await spell(slug)).resolution.ritualDegrees;
const types = actions => actions.filter(action => action.type !== "note").map(action => `${action.type}:${action.who ?? ""}`);

test("Rank 6–10 rituals: their actions", async () => {
    const binding = await degrees("rank-6/binding-circle");
    assert.equal(binding.levelPerRank, 2);
    assert.deepEqual(types(binding.degrees.criticalSuccess), ["mark:target"]);
    const separation = await degrees("rank-9/separation");
    assert.deepEqual([separation.degrees.success.find(action => action.type === "mark").seconds, separation.degrees.criticalSuccess.find(action => action.type === "mark").seconds], [2592000, 31536000]);
    const freedom = await degrees("rank-8/freedom");
    assert.deepEqual(types(freedom.degrees.criticalSuccess), ["free:target", "bonus:target"]);
    const prison = await degrees("rank-8/imprisonment");
    assert.deepEqual(prison.forms.map(form => [form.name, form.minRank]), [["Chains", null], ["Prison", null], ["Slumber", null], ["Temporal Stasis", null], ["Object", 9], ["Oubliette", 10]]);
    assert.deepEqual(prison.targetLevels, [{ rank: 8, maxLevel: 16 }, { rank: 9, maxLevel: 18 }, { rank: 10, maxLevel: 20 }]);
    assert.equal(prison.degrees.criticalSuccess.find(action => action.type === "form").bonusRank, 1);
    const sleepless = await degrees("rank-6/sleepless-season");
    assert.deepEqual([sleepless.degrees.criticalSuccess[0].strain?.name, sleepless.degrees.success.filter(action => action.type === "curse-save").length], ["Enfeebled", 1]);
    const harvest = await degrees("rank-9/void-harvest");
    assert.deepEqual(harvest.degrees.criticalSuccess.find(action => action.type === "area-controls").controls.map(control => control.key), ["doom", "undead", "living"]);
    assert.deepEqual(harvest.degrees.success.find(action => action.type === "area-controls").controls.map(control => control.key), ["doom", "undead"]);
    const curse = await degrees("rank-8/awaken-curse");
    assert.match(curse.degrees.criticalSuccess[0].text, /2 higher/);
});
