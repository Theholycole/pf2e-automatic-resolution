import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {casterChoiceSentence, casterTypeChoice, degreeChoiceRules, proveDegreeChoiceRow} from '../src/compiler/degree-choice-effect.js';
import {executableCasterChoice, inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';
import {inspectCompiledNativeOutcomeEffect} from '../scripts/native-outcome-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
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

test('Circle of Weakness: a lingering area whose degree Effect reads the caster\'s damage type', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-1/circle-of-weakness'), {nativeEffectCatalog: effects});
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial], [['sustain'], true]);
    assert.deepEqual(plan.resolution.casterChoice, {flag: 'energyType', values: ['acid', 'cold', 'electricity', 'fire', 'force', 'sonic'], label: 'Damage type'});
    const rows = Object.fromEntries(['success', 'failure', 'criticalFailure'].map(degree => [degree, plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule]));
    assert.deepEqual(Object.values(rows).map(rule => rule.chosenWeakness), [1, 2, 2]);
    assert.deepEqual(rows.criticalFailure.carriedConditions, ['immobilized']);
    for (const [degree, rule] of Object.entries(rows)) assert.equal(inspectCompiledNativeOutcomeEffect(plan.resolution.outcomes[degree].nativeEffects[0], {degree}).supported, true, degree);
    // The failure row doubles the success row's weakness; a row claiming anything else is refused.
    const {rules} = effects.get('Spell Effect: Circle of Weakness').mechanics;
    const failure = degreeChoiceRules(rules, 'failure');
    assert.ok(proveDegreeChoiceRow(failure.active, 'As success, except the weakness is doubled.', {rank: 1, casterChoice: failure.casterChoice, inherited: {chosenWeakness: 1}}));
    assert.equal(proveDegreeChoiceRow(failure.active, 'As success, except the weakness is doubled.', {rank: 1, casterChoice: failure.casterChoice, inherited: {chosenWeakness: 2}}), null);
    const success = degreeChoiceRules(rules, 'success');
    assert.equal(proveDegreeChoiceRow(success.active, 'The creature gains weakness 2 to the chosen damage type for 1 round.', {rank: 1, casterChoice: success.casterChoice}), null, 'wrong value at rank 1');
    assert.ok(proveDegreeChoiceRow(success.active, 'The creature gains weakness 2 to the chosen damage type for 1 round.', {rank: 3, casterChoice: success.casterChoice}), 'heightened');
});

test('caster choices: the stated list must be exactly the ChoiceSet\'s damage types', () => {
    const rule = {key: 'ChoiceSet', flag: 'energyType', choices: ['acid', 'cold', 'fire'].map(value => ({value}))};
    const choice = casterTypeChoice(rule);
    assert.deepEqual(choice.values, ['acid', 'cold', 'fire']);
    assert.ok(casterChoiceSentence('Choose one type of damage from the following list: acid, cold, or fire. Then save.', choice));
    assert.equal(casterChoiceSentence('Choose one type of damage from the following list: acid or cold.', choice), null, 'a missing type');
    assert.equal(casterTypeChoice({...rule, predicate: ['self:trait:elf']}), null, 'a predicated choice');
    assert.equal(casterTypeChoice({...rule, choices: [{value: 'acid'}, {value: 'shiny'}]}), null, 'not damage types');
    // A predicated ChoiceSet or a Weakness reading another flag leaves the Effect unread.
    const degree = {key: 'ChoiceSet', rollOption: 'x', choices: [{value: 'success'}, {value: 'failure'}]};
    assert.ok(degreeChoiceRules([degree, rule, {key: 'Weakness', type: '{item|flags.system.rulesSelections.energyType}', value: 1, predicate: ['x:success']}], 'success'));
    assert.equal(degreeChoiceRules([degree, rule, {key: 'Weakness', type: '{item|flags.system.rulesSelections.other}', value: 1, predicate: ['x:success']}], 'success'), null);
});

test('Circle of Weakness: narration naming the weakness is claimed only with the proved choice', async () => {
    const effects = await catalog();
    const changed = await spell('rank-1/circle-of-weakness');
    changed.system.description.value = changed.system.description.value.replace('acid, cold, electricity, fire, force, or sonic', 'acid, cold, or fire');
    const plan = compileAbility(changed, {nativeEffectCatalog: effects});
    assert.equal(plan.resolution.casterChoice, undefined);
    assert.equal(isExecutableLingeringPlan(plan), false);
});

test('Astral Rain: a cube until the start of your next turn, with the caster choosing the damage type', async () => {
    const plan = compileAbility(await spell('cantrip/astral-rain'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.area, lingering.endsAt, lingering.durationSeconds],
        [['enter'], true, {type: 'cube', value: 5}, 'caster-turn-start', 6]);
    assert.deepEqual(plan.resolution.casterChoice, {kind: 'damage-type', values: ['bludgeoning', 'piercing'], label: 'Damage type'});
    assert.equal(executableCasterChoice(lingeringExposurePlan(plan)), true);
    // A typed item damage isn't retyped by the choice.
    const typed = await spell('cantrip/astral-rain');
    Object.values(typed.system.damage)[0].type = 'bludgeoning';
    assert.equal(compileAbility(typed).resolution.casterChoice, undefined);
    // A spell with its own duration doesn't take the next-turn lifetime.
    const lasting = await spell('cantrip/astral-rain');
    lasting.system.duration.value = '1 minute';
    assert.notEqual(compileAbility(lasting).resolution.lingering?.endsAt, 'caster-turn-start');
});
