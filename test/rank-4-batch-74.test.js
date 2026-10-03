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


// Rank 4, batch 74 (2026-10-02): Stasis (Will: Stunned 1; a Stasis note for 1 round, or 3 rounds shortened by an end-of-turn Will save; an unattended
// object's automatic critical failure a reminder).

test("Stasis: Stunned, and the stasis note for each failing result", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/stasis"));
    assert.deepEqual(plan.resolution.outcomes.success.effects.map(e => [e.slug, e.value]), [["stunned", 1]]);
    const note = d => plan.resolution.outcomes[d].noteEffects[0];
    assert.deepEqual([note("failure").label, note("failure").duration.value, note("failure").recurringSave ?? null], ["Stasis", 1, null]);
    assert.deepEqual([note("criticalFailure").duration.value, note("criticalFailure").duration.expiry, note("criticalFailure").recurringSave.mode, note("criticalFailure").recurringSave.statistic],
        [3, "turn-end", "reduce", "will"]);
    assert.match(note("failure").text, /invulnerable to all damage/);
    assert.ok(plan.resolution.reminders.some(r => /unattended object/.test(r.text)));
    assert.equal(plan.lifecycle.durationSpec.mode, "outcome");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another critical failure time wording isn't read.
    const other = compile(withText(await spell("rank-4/stasis"), html => html.replace("to reduce the remaining duration by 1 round", "to reduce the remaining duration by 2 rounds")));
    assert.equal(other.compilerEvidence.stasisRows, undefined);
});
