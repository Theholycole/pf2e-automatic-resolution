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


// Rank 3, batch 77 (2026-10-02): Steal Shadow (the Fortitude rows with PF2e's damage on the failing rows and Enfeebled for the spell's duration; each later
// round's first Sustain opens a basic save of the same damage for the targets that failed; the missing shadow a reminder).

test("Steal Shadow: the Sustain's basic save for the failed targets", async () => {
    const { sustainStrikePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/steal-shadow"));
    assert.equal(plan.resolution.check.basic, false);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].damage.multiplier, plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value])]),
        [[0, [["enfeebled", 1]]], [1, [["enfeebled", 1]]], [1, [["enfeebled", 2]]]]);
    assert.deepEqual(plan.resolution.sustainStrike.degrees, ["failure", "criticalFailure"]);
    assert.ok(plan.resolution.reminders.some(r => /cast a shadow/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const strike = sustainStrikePlan(plan);
    assert.deepEqual([strike.resolution.check.basic, strike.resolution.outcomes.criticalFailure.damage.multiplier, strike.resolution.outcomes.failure.effects.length], [true, 2, 0]);
    assert.equal(inspectSavePlan(strike).supported, true);
    // A Sustain save for a row that doesn't fail is refused.
    const bad = structuredClone(plan); bad.resolution.sustainStrike.degrees = ["success"];
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => /Sustain's basic save/.test(b.message)));
    // Another throttle isn't read.
    const other = compile(withText(await spell("rank-3/steal-shadow"), html => html.replace("(basic Fortitude save)", "(basic Reflex save)")));
    assert.equal(other.compilerEvidence.shadowTheft, undefined);
});
