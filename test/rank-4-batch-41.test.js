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


// Rank 4, batch 41 (2026-10-02): Ordained Purpose (its written rows read as the table; two described shifts — one degree worse for a creature that
// lost abilities by acting against its beliefs, one better at the GM's discretion for one filling its station — as one GM choice per target; the
// failing rows' Drop Prone compulsion a note for the creature's next turn).

test("Ordained Purpose: the GM's choice and the compulsion", async () => {
    const plan = compile(await spell("rank-4/ordained-purpose"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.degreeAdjustment.predicate.kind, 'gm-choice');
    assert.deepEqual(plan.resolution.degreeAdjustment.predicate.options.map(option => option.key), ['worse', 'better']);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].label, 'Compelled');
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /can't Stand/);
    assert.ok(plan.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'enemy-of-caster'));
    // Two shifts the same way aren't a choice.
    const other = compile(withText(await spell("rank-4/ordained-purpose"), html => html.replace('one degree of success better', 'one degree of success worse')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
