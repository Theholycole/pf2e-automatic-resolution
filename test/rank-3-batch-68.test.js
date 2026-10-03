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


// Rank 3, batch 68 (2026-10-02): Behold the Weave (Will: a Locked timeline note for the target's next turn — one action, at least two, or all — the GM
// plays the commitment; the 7th-rank emanation of enemies a reminder).

test("Behold the Weave: the locked-timeline note by result", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/behold-the-weave"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.equal(note("criticalSuccess"), undefined);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).duration.anchor, note(d).duration.expiry]), [["target-turn", "turn-end"], ["target-turn", "turn-end"], ["target-turn", "turn-end"]]);
    assert.match(note("success").text, /a single action/);
    assert.match(note("failure").text, /at least two of its actions/);
    assert.match(note("criticalFailure").text, /all of its actions/);
    assert.ok(plan.resolution.reminders.some(r => /30-foot emanation/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another commitment isn't read.
    const other = compile(withText(await spell("rank-3/behold-the-weave"), html => html.replace("commit all of its actions", "commit three of its actions")));
    assert.equal(other.compilerEvidence.weaveRows, undefined);
});
