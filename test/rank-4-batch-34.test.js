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


// Rank 4, batch 34 (2026-10-02): Containment (the force field's Hit Points by result at the cast rank, a note on the creature; a willing
// target's result is the GM's), Dirge of Remembrance (incorporeal creatures only; the damage bypasses all resistances through PF2e's own
// bypass option; failure and critical failure: semi-corporeal until the spell ends).

test("Containment: the field's Hit Points by row and rank", async () => {
    const plan = compile(await spell("rank-4/containment"));
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const success = plan.resolution.outcomes.success.noteEffects[0], failure = plan.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual(success.rankAmount, {base: 10, step: 5, interval: 1, baseRank: 4, multiplier: 1});
    assert.deepEqual(failure.rankAmount, {base: 40, step: 15, interval: 1, baseRank: 4, multiplier: 1});
    assert.match(failure.text, /Hardness 10, \{amount\} Hit Points/);
    assert.ok(plan.resolution.dataNotes.some(note => /willing target/.test(note)));
    // Other Hit Points in the success row aren't the field's.
    const other = compile(withText(await spell("rank-4/containment"), html => html.replace('instead of 40', 'instead of 30')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});

test("Dirge of Remembrance: incorporeal only, resistances bypassed, semi-corporeal note", async () => {
    const plan = compile(await spell("rank-4/dirge-of-remembrance"));
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'incorporeal', present: true}]);
    assert.equal(plan.resolution.resistanceBypass.ignore, 'all-damage');
    assert.deepEqual(inspectSavePlan(plan).blockers.filter(b => b.code === 'resistance-bypass'), []);
    for (const degree of ['failure', 'criticalFailure']) assert.equal(plan.resolution.outcomes[degree].noteEffects[0].label, 'Semi-corporeal');
    // A bypass the spell's sentence doesn't state is refused.
    const forged = structuredClone(plan); forged.resolution.resistanceBypass.sourceText = 'Each creature takes damage.';
    assert.ok(inspectSavePlan(forged).blockers.some(b => b.code === 'resistance-bypass'));
    const other = compile(withText(await spell("rank-4/dirge-of-remembrance"), html => html.replace(' (this damage bypasses its resistances)', ' (this damage ignores hardness)')));
    assert.equal(other.resolution.resistanceBypass ?? null, null);
});
