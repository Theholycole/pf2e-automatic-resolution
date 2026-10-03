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


// Rank 4, batch 68 (2026-10-02): Steal Voice (Fortitude: voiceless — PF2e has no such condition — as a note until the end of the target's next turn /
// 1 minute / unlimited; temporary immunity for 1 minute; voiceless creatures left out by the GM).

test("Steal Voice: a voiceless note for each failing result's time", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/steal-voice"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.equal(note("criticalSuccess"), undefined);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).label, note(d).duration.mode, note(d).duration.value ?? null, note(d).duration.unit ?? null, note(d).duration.expiry ?? null]),
        [["Voiceless", "fixed", 1, "rounds", "turn-end"], ["Voiceless", "fixed", 1, "minutes", null], ["Voiceless", "unlimited", null, null, null]]);
    assert.match(note("failure").text, /can't speak, create vocal sounds, or take auditory actions/);
    assert.match(note("failure").text, /the caster can choose to have their voice sound like either their own voice or the target's voice/);
    assert.ok(plan.resolution.reminders.some(r => /no voice or can't speak is immune/.test(r.sourceText)));
    assert.ok(plan.automation.compiledCapabilities.includes("stolen-voice"));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another failure duration wording isn't read.
    const other = compile(withText(await spell("rank-4/steal-voice"), html => html.replace("the duration is permanent", "the duration lasts forever")));
    assert.equal(other.compilerEvidence.stolenVoice, undefined);
});
