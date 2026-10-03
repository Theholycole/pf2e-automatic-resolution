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


// Rank 3, batch 59 (2026-10-02): Unseasonable Squall (Gust of Wind's lingering area for a burst: Medium or smaller creatures save when cast and on
// entering until the caster's next turn; a failure: Prone; a flying creature's failure is a critical failure — the text's 2d6 bludgeoning as that
// row's roll, pushed 30 feet away from the burst's center, Prone; the wind's effect on fires and objects a GM reminder).

test("Unseasonable Squall: the burst's gust", async () => {
    const plan = compile(await spell("rank-3/unseasonable-squall"));
    assert.equal(plan.resolution.lingering.endsAt, "caster-turn-start");
    assert.deepEqual(plan.resolution.lingering.events, ["enter"]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "size-at-most", size: "med" }]);
    assert.equal(plan.resolution.degreeAdjustment.map.failure, "criticalFailure");
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.damage.formulas.map(f => f.formula), ["2d6[bludgeoning]"]);
    assert.deepEqual([critical.forcedMovement.distance, critical.forcedMovement.direction], [30, "from-center"]);
    assert.deepEqual(critical.effects.map(e => e.slug), ["prone"]);
    assert.ok(plan.resolution.reminders.some(r => r.kind === "surroundings"));
    // Another push wording isn't read.
    const other = compile(withText(await spell("rank-3/unseasonable-squall"), html => html.replace("away from the center of the burst", "toward the center of the burst")));
    assert.equal(other.resolution.outcomes.criticalFailure?.forcedMovement?.direction === "from-center", false);
});
