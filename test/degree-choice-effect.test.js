import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {degreeChoiceRules, proveDegreeChoiceRow} from '../src/compiler/degree-choice-effect.js';
import {inspectSavePlan, isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

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

test('Distracting Decoy: its Effect preset per degree carries Off-Guard and the critical –2 to attacks', async () => {
    const plan = compileAbility(await spell('rank-1/distracting-decoy'), {nativeEffectCatalog: await catalog()});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const failure = plan.resolution.outcomes.failure, critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual([failure.nativeEffects[0].outcomeRule.selectionValue, critical.nativeEffects[0].outcomeRule.selectionValue], ['failure', 'critical-failure']);
    assert.ok(failure.effects.find(effect => effect.slug === 'off-guard').carriedBy);
    assert.equal(plan.resolution.outcomes.success.nativeEffects.length, 0);
});

test('Ill Omen: roll twice once, or every time', async () => {
    const plan = compileAbility(await spell('rank-1/ill-omen'), {nativeEffectCatalog: await catalog()});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.match(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.claimText, /^Every time/);
});

test('degree-choice proof refuses rows its rules do not state', () => {
    const rules = [{key: 'ChoiceSet', rollOption: 'x', choices: [{value: 'failure'}, {value: 'critical-failure'}]},
        {key: 'FlatModifier', predicate: ['x:critical-failure'], selector: 'attack', type: 'circumstance', value: -2}];
    const {active} = degreeChoiceRules(rules, 'critical-failure');
    assert.ok(proveDegreeChoiceRow(active, 'As failure, but the creature also takes a –2 circumstance penalty to attacks.'));
    assert.equal(proveDegreeChoiceRow(active, 'As failure, but the creature also takes a –3 circumstance penalty to attacks.'), null);
    assert.equal(proveDegreeChoiceRow(active, 'As failure, but the creature also takes a –2 status penalty to attacks.'), null);
    // "while it's off-guard" needs the Effect to grant the off-guard.
    assert.equal(proveDegreeChoiceRow(active, "As failure, but the creature also takes a –2 circumstance penalty to attacks while it's off-guard."), null);
    // A rule the row doesn't state is refused.
    assert.equal(proveDegreeChoiceRow(active, 'The creature is off-guard.'), null);
    // Rules predicated on anything but this Effect's own choice aren't read.
    assert.equal(degreeChoiceRules([...rules, {key: 'FlatModifier', predicate: ['target:trait:undead'], selector: 'ac', type: 'status', value: -1}], 'failure'), null);
});

test('Fiendish Rift: a sustained lingering area with extra damage for holy creatures', async () => {
    const plan = compileAbility(await spell('rank-7/fiendish-rift'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.initial, plan.resolution.lingering.events], [true, ['sustain']]);
    assert.deepEqual(plan.resolution.conditionalDamage.map(entry => [entry.formula, entry.trait]), [['10[spirit]', 'holy']]);
});
