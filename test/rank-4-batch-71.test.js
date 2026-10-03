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


// Rank 4, batch 71 (2026-10-02): Favorable Review (Will: a Favorable review note for 1 week on a failure, unlimited with the attitude two steps better
// on a critical failure; the subject and what the target notices a card reminder; Dismissal).

test("Favorable Review: the bound-speech note for each failing result", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/favorable-review"));
    const notes = d => (plan.resolution.outcomes[d].noteEffects ?? []).map(n => [n.label, n.duration.mode, n.duration.value ?? null, n.duration.unit ?? null]);
    assert.deepEqual(notes("criticalSuccess"), []);
    assert.deepEqual(notes("success"), []);
    assert.deepEqual(notes("failure"), [["Favorable review", "fixed", 7, "days"]]);
    assert.deepEqual(notes("criticalFailure"), [["Favorable review", "unlimited", null, null]]);
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /two steps better/);
    assert.ok(plan.resolution.reminders.some(r => /Name the subject/.test(r.text)));
    assert.equal(plan.lifecycle.dismissal?.action, "Dismiss");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another attitude shift isn't read.
    const other = compile(withText(await spell("rank-4/favorable-review"), html => html.replace("two degrees better", "one degree better")));
    assert.equal(other.compilerEvidence.reviewRows, undefined);
});
