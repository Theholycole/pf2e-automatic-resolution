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


// Rank 5, batch 44 (2026-10-02): Wave of Despair (Will: a Despair note — no reactions — for 1 round / 1 minute / 1 minute with a save at the start of
// each of its turns whose failure grants Slowed 1 for that turn; the critical failure also Slowed 1 for 1 minute).

test("Wave of Despair: the Despair note's start-of-turn save, and the critical failure's Slowed", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-5/wave-of-despair"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.equal(note("criticalSuccess"), undefined);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).duration.value, note(d).duration.unit, note(d).recurringSave.timing, note(d).recurringSave.mode, note(d).recurringSave.condition.slug, note(d).recurringSave.condition.value]),
        [[1, "rounds", "turn-start", "turn-condition", "slowed", 1], [1, "minutes", "turn-start", "turn-condition", "slowed", 1], [1, "minutes", "turn-start", "turn-condition", "slowed", 1]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value, e.duration.value, e.duration.unit]), [["slowed", 1, 1, "minutes"]]);
    assert.ok(validNoteEffect(note("failure")));
    assert.equal(validNoteEffect({ ...note("failure"), recurringSave: { ...note("failure").recurringSave, timing: "turn-end" } }), false);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another critical failure condition isn't read.
    const other = compile(withText(await spell("rank-5/wave-of-despair"), html => html.replace("automatically slowed 1", "automatically stunned 1")));
    assert.equal(other.compilerEvidence.despairRows, undefined);
});
