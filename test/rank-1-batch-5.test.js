import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, targetOutcomeConditions} from '../scripts/basic-save-core.js';
import {proveStatedEffect} from '../src/compiler/degree-choice-effect.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
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

test('Blood Infusion: a thrall within 15 feet, bleed by degree, and the Effect removing bleed immunity on every row that states it', async () => {
    const plan = compileAbility(await spell('rank-1/blood-infusion'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.targeting.thrall.origin, plan.targeting.thrall.within, plan.targeting.thrall.destroyed], ['within', 15, true]);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule.kind), ['stated-effect', 'stated-effect', 'stated-effect']);
    assert.equal(plan.resolution.outcomes.failure.damage.formulas[0].formula, '(@item.rank)d6[bleed]', 'the |shortLabel display option is dropped');
    assert.equal(proveStatedEffect([{key: 'Immunity', mode: 'remove', type: 'bleed'}], 'The target loses any immunity to fire.'), false);
});

test('Temporal Distortion: one d4 for the cast picks the condition; a 4 is the caster\'s choice', async () => {
    const plan = compileAbility(await spell('rank-1/temporal-distortion'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.conditionRoll.results, {1: 'clumsy', 2: 'enfeebled', 3: 'stupefied'});
    const critical = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(critical.map(effect => [effect.slug, effect.value, effect.duration.value]), [['clumsy', 3, 2], ['enfeebled', 3, 2], ['stupefied', 3, 2]]);
    const state = {outcomes: plan.resolution.outcomes, conditionRoll: {...plan.resolution.conditionRoll, rolled: 2, slug: 'enfeebled'}};
    assert.deepEqual(targetOutcomeConditions(state, {degree: 'failure'}).map(effect => `${effect.slug} ${effect.value} ${effect.duration.value}`), ['enfeebled 1 4']);
    assert.deepEqual(targetOutcomeConditions({...state, conditionRoll: {...state.conditionRoll, slug: null}}, {degree: 'failure'}), [], 'nothing before the choice');
});
