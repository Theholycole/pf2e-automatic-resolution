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


// Rank 5, batch 49 (2026-10-02): Whispers of a Dead Goddess (Will, a sustained lingering 15-foot burst: in it at the cast or entering; immune 1 hour on
// a critical success; Stunned 1; the failure's stay a note for 1 round; the critical failure's suggestion a note for the sustained minute).

test("Whispers of a Dead Goddess: the lingering saves, Stunned, immunity and the notes", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/whispers-of-a-dead-goddess"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.sustained], [["enter"], true, true]);
    assert.deepEqual([plan.resolution.temporaryImmunity.degrees, plan.resolution.temporaryImmunity.duration], [["criticalSuccess"], { value: 1, unit: "hours" }]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => `${e.slug}${e.value}`)), [["stunned1"], ["stunned1"], ["stunned1"]]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])),
        [[["Held by the whispers", 1, "rounds"]], [["Held by the whispers", 1, "rounds"], ["Whispered suggestion", 1, "minutes"]]]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "enter" })).blockers ?? [], []);
    // Another hold isn't read.
    const other = compile(withText(await spell("rank-5/whispers-of-a-dead-goddess"), html => html.replace("will not voluntarily leave the area", "can't leave the area")));
    assert.equal(other.compilerEvidence.deadWhispers, undefined);
});
