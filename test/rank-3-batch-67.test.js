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


// Rank 3, batch 67 (2026-10-02): Censure Falsehoods (Fortitude: Sickened 1 / Sickened 2 with the flat check on speech; a critical failure's
// Deception or Stealth checks raise the sickened value by 1, to 4, by the GM's control; who may be targeted a note).

test("Censure Falsehoods: the choking animals and the lies", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-3/censure-falsehoods"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value])), [[["sickened", 1]], [["sickened", 2]], [["sickened", 2]]]);
    const notes = d => plan.resolution.outcomes[d].noteEffects ?? [];
    assert.deepEqual([notes("failure").map(n => n.label), notes("criticalFailure").map(n => n.label)], [["Choking animals"], ["Choking animals", "Lies make it sicker"]]);
    assert.deepEqual(notes("criticalFailure")[1].triggeredIncrease, { slug: "sickened", maximum: 4, trigger: "attempted a Deception or Stealth check" });
    assert.ok([...notes("failure"), ...notes("criticalFailure")].every(validNoteEffect));
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ["spell-note"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another maximum wording isn't read.
    const other = compile(withText(await spell("rank-3/censure-falsehoods"), html => html.replace("increases by 1", "increases by 2")));
    assert.equal(other.compilerEvidence.censureRows, undefined);
});
