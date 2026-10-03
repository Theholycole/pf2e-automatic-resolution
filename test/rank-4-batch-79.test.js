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


// Rank 4, batch 79 (2026-10-02): Planar Tether (Will: a Planar tether note for 1 minute / 10 minutes / 1 hour carrying the counteract ward — Ongoing
// spells' "Counteract with …" control at the cast rank).

test("Planar Tether: the tether note with its counteract ward, by result", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect, prepareNoteEffectSource } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/planar-tether"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.equal(note("criticalSuccess"), undefined);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).duration.value, note(d).duration.unit, typeof note(d).ward.trigger]),
        [[1, "minutes", "string"], [10, "minutes", "string"], [1, "hours", "string"]]);
    assert.ok(validNoteEffect(note("failure")));
    assert.equal(validNoteEffect({ ...note("failure"), ward: { trigger: "" } }), false);
    const source = prepareNoteEffectSource(note("failure"), { castId: "c", sourceActorUuid: "A", sourceItemUuid: "I", sourceItemName: "Planar Tether", targetActorUuid: "T", degree: "failure", castRank: 6, dc: 24 });
    assert.equal(source.flags["pf2e-automatic-resolution"].runtime.ward.rank, 6);
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another time wording isn't read.
    const other = compile(withText(await spell("rank-4/planar-tether"), html => html.replace("The effect's duration is 10 minutes.", "The effect lasts 10 minutes.")));
    assert.equal(other.compilerEvidence.planeAnchor, undefined);
});
