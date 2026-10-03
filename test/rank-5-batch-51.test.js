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


// Rank 5, batch 51 (2026-10-02): Mind Probe (Will, sustained: a Mind probed note for the minute carrying the question control — the creature's Deception
// against the spell DC each Sustain, −4 circumstance on a critical failure; the answer, none, or a false one whispered to the GM).

test("Mind Probe: the question control's note, penalized on a critical failure", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect, prepareNoteEffectSource } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-5/mind-probe"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => note(d)?.questionCheck ?? null), [null, { skill: "deception" }, { skill: "deception", penalty: { value: -4, type: "circumstance" } }]);
    assert.ok(validNoteEffect(note("failure")));
    assert.equal(validNoteEffect({ ...note("failure"), questionCheck: { skill: "stealth" } }), false);
    const source = prepareNoteEffectSource(note("criticalFailure"), { castId: "c", sourceActorUuid: "A", sourceItemUuid: "I", sourceItemName: "Mind Probe", targetActorUuid: "T", degree: "criticalFailure", castRank: 5, dc: 25 });
    assert.deepEqual(source.flags["pf2e-automatic-resolution"].runtime.questionCheck, { skill: "deception", penalty: { value: -4, type: "circumstance" }, dc: 25 });
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another penalty isn't read.
    const other = compile(withText(await spell("rank-5/mind-probe"), html => html.replace("against your questions", "against everyone")));
    assert.equal(other.compilerEvidence.mindProbe, undefined);
});
