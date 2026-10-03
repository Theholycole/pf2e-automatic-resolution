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


// Rank 5, batch 40 (2026-10-02): Synesthesia (Will: PF2e's round Effect on a success, its minute Effect preset to failure or critical failure — the
// latter granting Stunned 2; everything Concealed from the creature a note for the same time).

test("Synesthesia: PF2e's Effects by result, preset, and the Concealed note", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/synesthesia"));
    const rule = d => plan.resolution.outcomes[d].nativeEffects[0].outcomeRule;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [rule(d).kind, rule(d).templateDuration.value, rule(d).templateDuration.unit, rule(d).degreeChoice?.value ?? null]),
        [["senses-effect", 1, "rounds", null], ["senses-effect", 1, "minutes", "failure"], ["senses-effect", 1, "minutes", "critical-failure"]]);
    assert.deepEqual(rule("failure").senses, { flatDC: 5, clumsy: 3, speed: { type: "status", value: -10 }, stunned: 2 });
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => e.slug)), [[], [], []]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.unit])),
        [[["Rewired senses", "rounds"]], [["Rewired senses", "minutes"]], [["Rewired senses", "minutes"]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another Clumsy value isn't read.
    const other = compile(withText(await spell("rank-5/synesthesia"), html => html.replace("Clumsy 3}", "Clumsy 2}")));
    assert.equal(other.compilerEvidence.sensesRows, undefined);
});
