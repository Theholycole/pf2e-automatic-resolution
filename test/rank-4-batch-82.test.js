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


// Rank 4, batch 82 (2026-10-02): Waking Dream (Will, sustained: Confused for the spell's duration — ending early on the failure's end-of-turn save, none on
// a critical failure; everything Concealed to the creature a note; the success's no-Sustain a reminder).

test("Waking Dream: Confused for the sustained spell with the failure's end-of-turn save", async () => {
    const { inspectSavePlan, isRecurringSaveLifetime, isSpellLifetime } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/waking-dream"));
    const [failure] = plan.resolution.outcomes.failure.effects, [critical] = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual([failure.slug, isSpellLifetime(failure), failure.recurringSave?.mode, isRecurringSaveLifetime(failure)], ["confused", true, "end", true]);
    assert.deepEqual([critical.slug, isSpellLifetime(critical), critical.recurringSave ?? null], ["confused", true, null]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])),
        [[["Dream visions", 1, "rounds"]], [["Dream visions", 1, "minutes"]], [["Dream visions", 1, "minutes"]]]);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another save wording isn't read.
    const other = compile(withText(await spell("rank-4/waking-dream"), html => html.replace("at the end of each of its turns", "at the start of each of its turns")));
    assert.equal(other.compilerEvidence.wakingVisions, undefined);
});
