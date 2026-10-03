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


// Rank 5, batch 45 (2026-10-02): Vindicator's Judgment (Fortitude: the hunted prey the GM's answer; a Judgment note — weakness 5, 10 at 7th, 15 at 9th,
// against the caster's Strikes and divine spells — until the end of the caster's next turn, or the spell's minute; Off-Guard too on a critical failure).

test("Vindicator's Judgment: the weakness notes at the cast rank, the hunted prey the GM's", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { noteAmountAt } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-5/vindicators-judgment"));
    const note = d => plan.resolution.outcomes[d].noteEffects?.[0];
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [note(d).duration.value, note(d).duration.unit, note(d).duration.expiry ?? null]),
        [[1, "rounds", "turn-end"], [1, "minutes", null], [1, "minutes", null]]);
    assert.deepEqual([5, 6, 7, 8, 9].map(rank => noteAmountAt(note("failure").rankAmount, rank)), [5, 5, 10, 10, 15]);
    assert.match(note("criticalFailure").text, /Off-Guard/);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects, []);
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, "gm-confirmed");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // An uneven heightening isn't read.
    const other = compile(withText(await spell("rank-5/vindicators-judgment"), html => html.replace("The weakness is 15.", "The weakness is 20.")));
    assert.equal(other.compilerEvidence.judgmentRows, undefined);
});
