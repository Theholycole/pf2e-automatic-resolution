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


// Rank 3, batch 121 (2026-10-03): Portrait of Spite and Geas (ritual-degrees) — a chosen punishment by the target's save; an obligation with its strain, its
// level limit by rank and its unwilling save from 5th.

test("Portrait of Spite: the punishment by the save", async () => {
    const portrait = compile(await spell("rank-5/portrait-of-spite"));
    assert.equal(portrait.resolution.kind, "ritual-degrees");
    const { degrees } = portrait.resolution.ritualDegrees;
    const critical = degrees.criticalSuccess[0];
    assert.deepEqual(critical.options.map(option => option.name), ["Clumsy", "Drained", "Enfeebled", "Stupefied"]);
    assert.deepEqual([critical.who, critical.statistic, critical.degreeValues, critical.seconds, critical.onset],
        ["target", "will", { failure: 4, criticalFailure: 4, success: 2, criticalSuccess: 0 }, 31536000, "1d6"]);
    assert.deepEqual(degrees.success[0].degreeValues, { failure: 2, criticalFailure: 2, success: 1, criticalSuccess: 0 });
    const rebound = degrees.criticalFailure.find(action => action.type === "punish");
    assert.deepEqual([rebound.who, rebound.degreeValues.failure], ["casters", 4]);
    // Mixed values aren't one punishment.
    const mixed = compile(withText(await spell("rank-5/portrait-of-spite"), html => html.replace("{Drained 4}", "{Drained 3}")));
    assert.notEqual(mixed.resolution.kind, "ritual-degrees");
});

test("Geas: the obligation, its strain, its limits", async () => {
    const geas = compile(await spell("rank-3/geas"));
    assert.equal(geas.resolution.kind, "ritual-degrees");
    const data = geas.resolution.ritualDegrees;
    assert.equal(data.levelPerRank, 2);
    assert.deepEqual(data.unwilling, { rank: 5, statistic: "will", seconds: [{ rank: 5, seconds: 604800 }, { rank: 7, seconds: 31536000 }, { rank: 9, seconds: 0 }] });
    const mark = data.degrees.success[0];
    assert.deepEqual([mark.type, mark.who, mark.strain.name, mark.strain.start, mark.strain.max], ["mark", "target", "Sickened", 1, 4]);
    const bonus = data.degrees.criticalSuccess.find(action => action.type === "bonus");
    assert.deepEqual(bonus.rules, [{ key: "FlatModifier", selector: "skill-check", type: "status", value: 1 }]);
    assert.ok(bonus.toggle);
    assert.equal(data.degrees.criticalFailure.find(action => action.type === "mark").who, "primary");
    // A different strain sentence isn't read.
    const other = compile(withText(await spell("rank-3/geas"), html => html.replace("to a maximum of sickened 4.", "to a maximum of sickened 4, and it takes 1 damage.")));
    assert.notEqual(other.resolution.kind, "ritual-degrees");
});
