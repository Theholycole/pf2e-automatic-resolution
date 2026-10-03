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


// Rank 5, batch 61 (2026-10-03): Strange Geometry (the GM's four separate cubes; each creature saves once, in one when cast or entering one; a failure's
// note for the spell — the terrain and random exit, the GM's — with a disbelief control that ends only its note).

test("Strange Geometry: separate cubes, one save each, a disbelievable failure note", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const { validSpellNote } = await import("../scripts/note-effects.js").catch(() => ({}));
    const plan = compile(await spell("rank-5/strange-geometry"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.area, lingering.areaCount, lingering.separateAreas, lingering.initial, lingering.events], [{ type: "cube", value: 10 }, 4, true, true, ["enter"]]);
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ["criticalSuccess", "success", "failure", "criticalFailure"]);
    for (const event of ["initial", "enter"]) assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event })).blockers ?? [], []);
    const note = plan.resolution.outcomes.failure.noteEffects.find(entry => entry.label === "Strange geometry");
    assert.deepEqual(note.disbelieve, { statistic: "will", endsSpell: false, needs: "success" });
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    // Another count of cubes than the item's size, or adjacent cubes allowed, isn't read.
    const other = compile(withText(await spell("rank-5/strange-geometry"), html => html.replace("each 10 feet on a side", "each 15 feet on a side")));
    assert.equal(other.compilerEvidence.twistedCubes, undefined);
    const adjacent = compile(withText(await spell("rank-5/strange-geometry"), html => html.replace("can't be adjacent to one another", "can be adjacent to one another")));
    assert.equal(adjacent.compilerEvidence.twistedCubes, undefined);
});
