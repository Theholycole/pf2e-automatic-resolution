import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableStrikeEffectsPlan} from '../scripts/strike-effects-core.js';

const root = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const profile = effect => ({id: effect._id, name: effect.name, type: effect.type, sourceFile: 'spell-effects', automation: {
    ruleKeys: [...new Set(effect.system.rules.map(rule => rule.key))], requiresConfiguration: effect.system.rules.some(rule => rule.key === 'ChoiceSet'), removesAfterRoll: false},
    mechanics: {rules: effect.system.rules, duration: effect.system.duration, start: effect.system.start}});
async function catalogOf(...files) {
    const catalog = new Map();
    for (const file of files) { const effect = await read(`spell-effects/${file}.json`); catalog.set(effect.name, profile(effect)); catalog.set(effect._id, profile(effect)); }
    return catalog;
}

test('Strike spells with caster Effects: Force Fling and Inner Upheaval', async () => {
    const fling = compileAbility(await read('spells/spells/rank-1/force-fling.json'), {nativeEffectCatalog: await catalogOf('effect-force-fling')});
    assert.equal(fling.resolution.kind, 'strike-effects');
    assert.equal(fling.automation.level, 'automatic');
    assert.equal(isExecutableStrikeEffectsPlan(fling), true);
    assert.deepEqual(fling.resolution.applications.map(application => [application.phase, application.removeAfterStrike]), [['before', false]]);
    const upheaval = compileAbility(await read('spells/spells/rank-1/inner-upheaval.json'), {nativeEffectCatalog: await catalogOf('spell-effect-inner-upheaval')});
    assert.equal(upheaval.automation.level, 'prompted'); // the Effect asks for a damage type
    assert.equal(isExecutableStrikeEffectsPlan(upheaval), true);
});

test('Strike spells with caster Effects: Fulminating Impact phases by stated damage', async () => {
    const plan = compileAbility(await read('spells/spells/rank-4/fulminating-impact.json'), {nativeEffectCatalog: await catalogOf('spell-effect-fulminating-impact-initial-strike', 'spell-effect-fulminating-impact')});
    assert.equal(isExecutableStrikeEffectsPlan(plan), true);
    assert.deepEqual(plan.resolution.applications.map(application => [application.label, application.phase, application.removeAfterStrike]), [
        ['Spell Effect: Fulminating Impact (Initial Strike)', 'before', true], ['Spell Effect: Fulminating Impact', 'after', false]]);
    // Text that doesn't state an Effect's damage can't be phased: refused.
    const source = await read('spells/spells/rank-4/fulminating-impact.json');
    source.system.description.value = source.system.description.value.replace('additional 1 electricity damage and 1 sonic damage', 'additional 2 electricity damage and 2 sonic damage');
    assert.notEqual(compileAbility(source, {nativeEffectCatalog: await catalogOf('spell-effect-fulminating-impact-initial-strike', 'spell-effect-fulminating-impact')}).resolution.kind, 'strike-effects');
});

test('Strike spells with caster Effects: result-dependent text and missing Effects are refused', async () => {
    const warding = await read('spells/spells/rank-3/warding-aggression.json');
    assert.notEqual(compileAbility(warding, {nativeEffectCatalog: await catalogOf('spell-effect-warding-aggression')}).resolution.kind, 'strike-effects');
    assert.notEqual(compileAbility(await read('spells/spells/rank-1/force-fling.json')).resolution.kind, 'strike-effects'); // no catalog Effect
    const extra = await read('spells/spells/rank-1/force-fling.json');
    extra.system.description.value = extra.system.description.value.replace('(–6 with an agile weapon).', '(–6 with an agile weapon). Each creature in a 10-foot emanation must attempt a Reflex save.');
    assert.notEqual(compileAbility(extra, {nativeEffectCatalog: await catalogOf('effect-force-fling')}).resolution.kind, 'strike-effects');
    // A forged plan: an after-phase Effect alone.
    const plan = compileAbility(await read('spells/spells/rank-1/force-fling.json'), {nativeEffectCatalog: await catalogOf('effect-force-fling')});
    plan.resolution.applications[0].phase = 'after';
    assert.equal(isExecutableStrikeEffectsPlan(plan), false);
});
