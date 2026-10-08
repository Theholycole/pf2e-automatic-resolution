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


// Rank 4, batch 127 (2026-10-03): Ephemeral Hazards (four placed squares, one lingering area, once per turn; the item's damage by the rows; a critical
// success immune for the spell; a success's later saves at least a success; a failure's and critical failure's squares difficult terrain for it).

test("Ephemeral Hazards: the hazards", async () => {
    const plan = compile(await spell("rank-4/ephemeral-hazards"));
    const { isExecutableLingeringPlan } = await import("../scripts/basic-save-core.js");
    assert.equal(isExecutableLingeringPlan(plan), true);
    const area = plan.resolution.lingering;
    assert.deepEqual([area.areaCount, area.separateAreas, area.oncePerTurn, area.area.type, area.events.sort()], [4, true, true, "square", ["enter", "turn-start"]]);
    assert.deepEqual(area.rowTerrain.degrees, ["failure", "criticalFailure"]);
    assert.equal(area.successLock.statistic, "will");
    assert.deepEqual([plan.resolution.temporaryImmunity.degrees, plan.resolution.temporaryImmunity.duration], [["criticalSuccess"], { value: 1, unit: "minutes" }]);
    // An unproved lock isn't executable.
    const broken = structuredClone(plan); broken.resolution.lingering.successLock.sourceText = "other";
    assert.equal(isExecutableLingeringPlan(broken), false);
});
