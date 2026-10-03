import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {compileSaveAdjustment} from '../src/compiler/save-preamble.js';
import {degreeFlagRules, proveDegreeFlagRow} from '../src/compiler/degree-choice-effect.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan, storedTriggerExposurePlan} from '../scripts/basic-save-core.js';
import {inspectCompiledNativeOutcomeEffect} from '../scripts/native-outcome-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
const outcome = (plan, degree) => plan.resolution.outcomes[degree];
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Blood Runs Cold: persistent-only damage by degree, and Slowed until the persistent cold damage ends', async () => {
    const plan = compileAbility(await spell('rank-2/blood-runs-cold'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => outcome(plan, degree).damage.multiplier), [0.5, 1, 2]);
    assert.equal(plan.compilerEvidence.componentSelectiveDamage.kind, 'persistent-only-degree-rows');
    const slowed = outcome(plan, 'criticalFailure').effects[0];
    assert.deepEqual([slowed.slug, slowed.endsWhen, slowed.duration ?? null], ['slowed', {event: 'persistent-damage-ended', damageType: 'cold'}, null]);
    assert.equal(outcome(plan, 'failure').effects[0].duration.value, 1);
    // A row that doesn't state the persistent amount isn't read.
    const vague = await spell('rank-2/blood-runs-cold');
    vague.system.description.value = vague.system.description.value.replace('takes half the persistent cold damage', 'takes some persistent cold damage');
    assert.equal(compileAbility(vague).compilerEvidence.componentSelectiveDamage, undefined);
});

test('Fungal Infestation: a flag-choice Effect whose weakness scales with the degree, while the persistent poison lasts', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-2/fungal-infestation'), {nativeEffectCatalog: effects});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const failure = outcome(plan, 'failure').nativeEffects[0].outcomeRule;
    const critical = outcome(plan, 'criticalFailure').nativeEffects[0].outcomeRule;
    assert.deepEqual([failure.kind, failure.selectionFlag, failure.selectionValue, critical.selectionValue, failure.damageType],
        ['persistent-linked-degree-effect', 'fungalInfestation', 1, 2, 'poison']);
    assert.equal(outcome(plan, 'success').nativeEffects?.length ?? 0, 0);
    const {rules} = effects.get('Spell Effect: Fungal Infestation').mechanics;
    // At rank 4 the failure's weakness is 2; a row claiming 1 is refused.
    assert.ok(proveDegreeFlagRow(degreeFlagRules(rules, 'failure').active, "While it's taking this persistent poison damage, it has weakness 2 to fire and weakness 2 to slashing.", {rank: 4}));
    assert.equal(proveDegreeFlagRow(degreeFlagRules(rules, 'failure').active, "While it's taking this persistent poison damage, it has weakness 1 to fire and weakness 1 to slashing.", {rank: 4}), null);
    // A missing type is refused.
    assert.equal(proveDegreeFlagRow(degreeFlagRules(rules, 'failure').active, "While it's taking this persistent poison damage, it has weakness 1 to fire.", {rank: 2}), null);
});

test('Blood Vendetta: a row Effect lasting until the bleeding stops, inherited by "As failure"', async () => {
    const plan = compileAbility(await spell('rank-2/blood-vendetta'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['failure', 'criticalFailure']) {
        const [linked] = outcome(plan, degree).nativeEffects;
        assert.deepEqual([linked.outcomeRule.kind, linked.outcomeRule.check, linked.outcomeRule.damageType], ['persistent-linked-effect', 'save', 'bleed']);
        assert.equal(inspectCompiledNativeOutcomeEffect(linked, {degree}).supported, true);
    }
    assert.equal(plan.lifecycle.durationSpec.mode, 'outcome');
    // A weakness the Effect doesn't give is refused.
    const [linked] = outcome(plan, 'failure').nativeEffects;
    assert.equal(inspectCompiledNativeOutcomeEffect({...linked, outcomeRule: {...linked.outcomeRule, claimText: linked.outcomeRule.claimText.replace('weakness 1', 'weakness 2')}}, {degree: 'failure'}).supported, false);
});

test('Blistering Invective: a GM-answered +4 circumstance bonus to the save', async () => {
    const plan = compileAbility(await spell('rank-2/blistering-invective'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const adjustment = plan.resolution.attackAdjustment;
    assert.deepEqual([adjustment.appliesTo, adjustment.modifierType, adjustment.choices.map(choice => choice.value)], ['save', 'circumstance', [4, 0]]);
    // Another save's bonus, or a bonus that depends on the roll, isn't read.
    assert.equal(compileSaveAdjustment('<p>If it is a dragon, it gains a +4 circumstance bonus to its Reflex save.</p>', 'will'), null);
    assert.equal(compileSaveAdjustment('<p>If it critically succeeds, it gains a +2 circumstance bonus to its save.</p>', 'will'), null);
});

test('Crescent Scepter: a trigger every attacker sets off until your next turn; "As success, but Frightened 2" replaces the value', async () => {
    const plan = compileAbility(await spell('rank-1/crescent-scepter'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.endsOnTrigger, stored.markerDuration, stored.durationSeconds], [false, {value: 1, unit: 'rounds', expiry: 'turn-start'}, null]);
    assert.ok(stored.notes.some(note => /triggering attack roll/.test(note)));
    const exposure = storedTriggerExposurePlan(plan);
    assert.equal(supported(exposure), true);
    assert.deepEqual(outcome(exposure, 'failure').effects.map(effect => `${effect.slug} ${effect.value}`), ['frightened 2']);
});
