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


// Rank 4, batch 64 (2026-10-02): Infectious Melody (enemies in a 15-foot emanation that hear it, Will: PF2e's −2 to linguistic Intimidation for
// 1 round / 3 rounds / 1 hour by result; singing to speak, Perform, the flat check and no Undetected as notes).

test("Infectious Melody: the penalty Effects by duration", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/infectious-melody"));
    const rows = d => plan.resolution.outcomes[d];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => rows(d).nativeEffects.map(e => [e.outcomeRule.kind, e.document.mechanics.duration.value, e.document.mechanics.duration.unit])),
        [[["duration-bound-penalty-effect", 1, "rounds"]], [["duration-bound-penalty-effect", 3, "rounds"]], [["duration-bound-penalty-effect", 1, "hours"]]]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => rows(d).noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])),
        [[["Singing along", 1, "rounds"]], [["Singing along", 3, "rounds"]], [["Singing along", 1, "hours"]]]);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ["spell-note"]);
    // ("nearly impossible … to remain Undetected" grants nothing.)
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => rows(d).effects.length), [0, 0, 0]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another penalty isn't read.
    const other = compile(withText(await spell("rank-4/infectious-melody"), html => html.replace("-2 status penalty on linguistic", "-3 status penalty on linguistic")));
    assert.equal(other.compilerEvidence.boundPenalty, undefined);
});
