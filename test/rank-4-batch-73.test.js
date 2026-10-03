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


// Rank 4, batch 73 (2026-10-02): Inevitable Destination (Will, the enemy only: −10-foot circumstance Speed penalty until the end of its next turn; a
// Tethered note for the spell's 2 rounds that an Escape against the spell DC ends; the critical failure's pull 10 feet toward the caster and Prone).

test("Inevitable Destination: the Speed penalty, the tether an Escape ends, the pull and Prone", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { validNoteEffect } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/inevitable-destination"));
    const notes = d => (plan.resolution.outcomes[d].noteEffects ?? []);
    assert.deepEqual(notes("success").map(n => [n.label, n.rules[0].selector, n.rules[0].type, n.rules[0].value, n.duration.expiry]), [["Hampered footsteps", "all-speeds", "circumstance", -10, "turn-end"]]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => notes(d).map(n => [n.label, n.escape, n.duration.value])), [[["Tethered", true, 2]], [["Tethered", true, 2]]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.forcedMovement, { kind: "pull", distance: 10, upTo: false, optional: false, direction: "toward" });
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["prone"]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "enemy-of-caster" }]);
    assert.ok(validNoteEffect(notes("failure")[0]));
    assert.equal(validNoteEffect({ ...notes("failure")[0], escape: "yes" }), false);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another pull wording isn't read.
    const other = compile(withText(await spell("rank-4/inevitable-destination"), html => html.replace("pulled 10 feet closer to you", "pushed 10 feet away from you")));
    assert.equal(other.compilerEvidence.tetherRows, undefined);
});
