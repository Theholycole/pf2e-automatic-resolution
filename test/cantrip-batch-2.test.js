import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {degreeChoiceRules, proveDegreeChoiceRow} from '../src/compiler/degree-choice-effect.js';
import {replacementRule, resistanceMismatch} from '../src/compiler/direct-effect-resolution-compiler.js';
import {parseHeightenedDurations} from '../src/compiler/heightened-duration-compiler.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
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

test('Tangle Vine: the attack table\'s degree Effect on each hit, ended by Escape, heightened durations', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('cantrip/tangle-vine'), {nativeEffectCatalog: effects});
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const crit = plan.resolution.outcomes.criticalSuccess.nativeEffects[0], hit = plan.resolution.outcomes.success.nativeEffects[0];
    assert.deepEqual([crit.outcomeRule.selectionValue, crit.outcomeRule.carriedConditions, crit.outcomeRule.escape], ['critical-success', ['immobilized'], {dc: 'spell'}]);
    assert.deepEqual([hit.outcomeRule.selectionValue, hit.outcomeRule.carriedConditions, hit.outcomeRule.escape], ['success', [], {dc: 'spell'}]);
    assert.deepEqual(hit.outcomeRule.heightenedDurations, [{minRank: 2, value: 2, unit: 'rounds'}, {minRank: 4, value: 1, unit: 'minutes'}]);
    for (const degree of ['criticalSuccess', 'success']) assert.equal(inspectCompiledNativeOutcomeEffect(plan.resolution.outcomes[degree].nativeEffects[0], {degree}).supported, true, degree);
    assert.equal(plan.resolution.outcomes.failure.nativeEffects?.length ?? 0, 0);
    // The Escape sentence must name every condition the Effect grants; a different penalty is refused.
    const {rules} = effects.get('Spell Effect: Tangle Vine').mechanics;
    const critical = degreeChoiceRules(rules, 'critical-success').active;
    assert.equal(proveDegreeChoiceRow(critical, 'The target gains the Immobilized condition and takes a –10-foot circumstance penalty to its Speeds for 1 round. It can attempt to Escape against your spell DC to remove the penalty.'), null);
    assert.equal(proveDegreeChoiceRow(degreeChoiceRules(rules, 'success').active, 'The target takes a –5-foot circumstance penalty to its Speeds for 1 round.'), null);
    // "The effects last for 2 rounds." is a heightened duration.
    assert.deepEqual(parseHeightenedDurations('<p><strong>Heightened (2nd)</strong> The effects last for 2 rounds.</p>').entries.map(entry => [entry.minRank, entry.value, entry.unit]), [[2, 2, 'rounds']]);
});

test('Boost Eidolon: the newer of Boost and Reinforce Eidolon replaces the older; a stated resistance must match', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('cantrip/boost-eidolon'), {nativeEffectCatalog: effects});
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.resolution.replaces.spells], ['effect', 'automatic', ['Reinforce Eidolon']]);
    assert.equal(replacementRule('Your eidolon can benefit from either boost eidolon or reinforce eidolon, but not both; if you cast one of these spells during the other\'s duration, the newer spell replaces the older one.', 'Some Other Spell'), null);
    // Reinforce Eidolon's Effect gives resistance 0 at rank 1, where the text says a minimum of 1: PF2e's Effect is applied,
    // with the difference noted (user decision: trust PF2e's Effect data).
    const reinforce = compileAbility(await spell('cantrip/reinforce-eidolon'), {nativeEffectCatalog: effects});
    assert.equal(reinforce.automation.level, 'automatic');
    // (User decision: the text's minimum is added to PF2e's formula.)
    assert.deepEqual(reinforce.resolution.ruleOverrides, [{index: 1, key: 'Resistance', patch: {value: 'max(1,floor(@item.level/2))'}}]);
    assert.match(resistanceMismatch('You gain resistance 2 to all damage (except force).', [{key: 'Resistance', type: 'all-damage', value: 'ceil(@item.level/2)'}], 1), /resistance 1 at rank 1/);
    assert.equal(resistanceMismatch('You gain resistance equal to 8 plus your Strength modifier.', [{key: 'Resistance', type: 'all-damage', value: '2*@item.level + @actor.abilities.str.mod'}], 4), false);
});

test('Buzzing Bites: a Sickened floor while the spell is active, and immunity from its end', async () => {
    const plan = compileAbility(await spell('cantrip/buzzing-bites'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.temporaryImmunity.startsWhen, plan.resolution.temporaryImmunity.duration], ['spell-ended', {value: 1, unit: 'minutes'}]);
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual([critical.conditionFloor.slug, critical.conditionFloor.value, critical.conditionFloor.lifetime], ['sickened', 1, 'spell']);
    assert.equal(critical.effects[0].duration.mode, 'unlimited', 'Sickened itself outlives the spell');
    // A floor above the condition's value, or on a spell with no lifetime to end it, is refused.
    const higher = await spell('cantrip/buzzing-bites');
    higher.system.description.value = higher.system.description.value.replace("can't be reduced below 1", "can't be reduced below 2");
    assert.equal(inspectSavePlan(compileAbility(higher)).supported, false);
    const instant = await spell('cantrip/buzzing-bites');
    instant.system.duration = {sustained: false, value: ''};
    assert.equal(inspectSavePlan(compileAbility(instant)).supported, false);
});
