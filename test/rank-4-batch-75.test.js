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


// Rank 4, batch 75 (2026-10-02): Trickster's Twin (Will: a note for 1 minute on each affected row, with the GM's Disbelieve control — automatic on a
// success, a Will save needing a success on a failure, a critical success on a critical failure — ending the spell).

test("Trickster's Twin: the double's note with each result's Disbelieve threshold", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/tricksters-twin"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.equal(note("criticalSuccess"), undefined);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).disbelieve.statistic, note(d).disbelieve.needs, note(d).duration.value, note(d).duration.unit]),
        [["will", "automatic", 1, "minutes"], ["will", "success", 1, "minutes"], ["will", "criticalSuccess", 1, "minutes"]]);
    assert.ok(["success", "failure", "criticalFailure"].every(d => validNoteEffect(note(d))));
    assert.equal(validNoteEffect({ ...note("failure"), disbelieve: { statistic: "will", endsSpell: true, needs: "failure" } }), false);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another threshold wording isn't read.
    const other = compile(withText(await spell("rank-4/tricksters-twin"), html => html.replace("must critically succeed", "must succeed twice")));
    assert.equal(other.compilerEvidence.twinIllusion, undefined);
});
