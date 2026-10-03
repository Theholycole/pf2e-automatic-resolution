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


// Rank 5, batch 42 (2026-10-02): Subconscious Suggestion (Will: a note held until the caster's next preparations — unlimited, the GM ends it — saying
// the triggered suggestion lasts 1 minute, or 1 hour on a critical failure; the trigger and what the target notices a card reminder).

test("Subconscious Suggestion: the held suggestion's note by result", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/subconscious-suggestion"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.deepEqual(["criticalSuccess", "success"].map(note), [undefined, undefined]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => [note(d).label, note(d).duration.mode]), [["Subconscious suggestion", "unlimited"], ["Subconscious suggestion", "unlimited"]]);
    assert.match(note("failure").text, /follows the suggestion for 1 minute/);
    assert.match(note("criticalFailure").text, /follows the suggestion for 1 hour/);
    assert.ok(plan.resolution.reminders.some(r => /knows the caster tried to control it/.test(r.text)));
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another holding time isn't read.
    const other = compile(withText(await spell("rank-5/subconscious-suggestion"), html => html.replace("until the next time you prepare", "for 1 day")));
    assert.equal(other.compilerEvidence.suggestionRows, undefined);
});
