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


// Rank 5, batch 52 (2026-10-02): Infectious Comedy (Will, sustained: no reactions a note, Slowed 1 for the spell on a failure, Prone and a lost round
// first on a critical failure; the spread a card for each Sustain, its saves posting no card).

test("Infectious Comedy: the rows for the sustained spell and the spread card", async () => {
    const { inspectSavePlan, isSpellLifetime } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/infectious-comedy"));
    assert.deepEqual(plan.resolution.chainSave.perCast, true);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(e => [e.slug, e.value, isSpellLifetime(e)]), [["slowed", 1, true]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["prone", "slowed"]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.value, n.duration.unit])),
        [[["Giggling", 1, "minutes"]], [["Giggling", 1, "minutes"]], [["Giggling", 1, "minutes"], ["Doubled over", 1, "rounds"]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another spread distance rule isn't read.
    const other = compile(withText(await spell("rank-5/infectious-comedy"), html => html.replace("You can't target the same creature more than once with this spell.", "You can target the same creature again.")));
    assert.equal(other.compilerEvidence.comedyRows, undefined);
});
