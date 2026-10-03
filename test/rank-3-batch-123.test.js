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


// Rank 3, batch 123 (2026-10-03): rituals carrying a disease (ritual-degrees) — Plague Shot, Mosquito Blight.

import { readStage } from "../src/compiler/ritual-degrees.js";

test("Plague Shot: the disease from the text, the shots, the backfire", async () => {
    const shot = compile(await spell("rank-5/plague-shot"));
    assert.equal(shot.resolution.kind, "ritual-degrees");
    const data = shot.resolution.ritualDegrees;
    assert.deepEqual([data.affliction.name, data.affliction.traits, data.affliction.level, data.affliction.save, data.affliction.onset],
        ["Siege Sickness", ["disease"], 8, { statistic: "fortitude", dc: 24 }, { value: 1, unit: "days" }]);
    assert.deepEqual(data.affliction.stages.map(stage => stage.conditions.map(entry => `${entry.slug}${entry.value ?? ""}`).join("+")), ["sickened2", "enfeebled1+sickened2", "enfeebled2+sickened3", "enfeebled3+sickened3", ""]);
    assert.equal(data.affliction.stages[4].death, true);
    assert.equal(data.affliction.stages[3].notes.length, 1);
    assert.deepEqual(data.degrees.criticalSuccess, [{ type: "carrier", who: "primary", virulent: true, radius: 60, seconds: 3600 }]);
    assert.equal(data.degrees.success[0].virulent, false);
    assert.deepEqual([data.degrees.criticalFailure[0].type, data.degrees.criticalFailure[0].who, data.degrees.criticalFailure[0].stage], ["expose", "targets", 2]);
    // A stage the reader doesn't know isn't read.
    const other = compile(withText(await spell("rank-5/plague-shot"), html => html.replace("sickened 3, and a creature", "sickened 3, a curse of thirst, and a creature")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});

test("Mosquito Blight: the infestation, the hive, the deadlier disease", async () => {
    const blight = compile(await spell("rank-5/mosquito-blight"));
    assert.equal(blight.resolution.kind, "ritual-degrees");
    const data = blight.resolution.ritualDegrees;
    assert.deepEqual([data.affliction.name, data.affliction.save, data.affliction.onset], ["Witch's Hunger", { statistic: "fortitude", dc: null }, { value: "1d6", unit: "hours" }]);
    const infest = data.degrees.success[0];
    assert.deepEqual([infest.type, infest.seconds, infest.hive, infest.arthropods.bonus, infest.stageOverride], ["infestation", 432000, { size: "tiny", hardness: 5, hp: 10, endsAfter: 3600 }, 1, null]);
    assert.deepEqual(data.degrees.criticalSuccess[0].stageOverride, { 3: "unconscious", 4: "death" });
    assert.deepEqual([data.degrees.criticalFailure[0].type, data.degrees.criticalFailure[0].who], ["expose", "primary"]);
});

test("An affliction stage: conditions, time, death and contagion", () => {
    assert.deepEqual(readStage("@UUID[Compendium.pf2e.conditionitems.Item.x]{Enfeebled 2} and @UUID[Compendium.pf2e.conditionitems.Item.y]{Slowed 1} (1 day)"),
        { conditions: [{ slug: "enfeebled", value: 2 }, { slug: "slowed", value: 1 }], duration: { value: 1, unit: "days" }, death: false, notes: [] });
    assert.equal(readStage("death").death, true);
    assert.equal(readStage("Sickened 2 and the creature sprouts wings (1 day)"), null);
});
