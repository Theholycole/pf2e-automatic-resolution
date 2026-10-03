import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, targetParticipates, splashTargets, executableSplash} from '../scripts/basic-save-core.js';
import {splashParts, splashFormula} from '../scripts/splash-damage.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));

test('splash spell attacks compile: Acid Splash and Percussive Impact', async () => {
    const acid = compileAbility(await fixture('cantrip/acid-splash.json'));
    assert.equal(inspectSavePlan(acid).supported, true, JSON.stringify(inspectSavePlan(acid).blockers));
    assert.deepEqual(acid.resolution.splash, {radius: 5, componentIds: ['gcovwqxwitqchoin']});
    assert.equal(acid.compilerEvidence.componentSelectiveDamage, undefined);
    assert.equal(acid.resolution.outcomes.criticalSuccess.damage.mode, 'mixed');
    assert.match(acid.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, /persistent,acid/);
    const impact = compileAbility(await fixture('rank-3/percussive-impact.json'));
    assert.equal(inspectSavePlan(impact).supported, true, JSON.stringify(inspectSavePlan(impact).blockers));
    const [deafened] = impact.resolution.outcomes.criticalSuccess.effects;
    assert.equal(deafened.slug, 'deafened');
    // "the duration of the deafened condition increases by 2 rounds" per +2 ranks.
    assert.deepEqual(deafened.duration.heightening, {increase: 2, interval: 2, rank: 3});
    // Exploding Earth: its critical-hit Fortitude save (fall Prone) is the ordinary follow-up save.
    const earth = compileAbility(await fixture('rank-2/exploding-earth.json'));
    assert.equal(inspectSavePlan(earth).supported, true, JSON.stringify(inspectSavePlan(earth).blockers));
    assert.equal(earth.resolution.outcomes.criticalSuccess.followUps[0].check.statistic, 'fortitude');
    assert.equal(earth.resolution.outcomes.criticalSuccess.followUps[0].outcomes.failure.effects[0].slug, 'prone');
});

test('splash plans: a forged or mismatched splash is refused', async () => {
    const acid = compileAbility(await fixture('cantrip/acid-splash.json'));
    const wrongRadius = structuredClone(acid); wrongRadius.resolution.splash.radius = 10;
    assert.equal(executableSplash(wrongRadius), false);
    assert.equal(inspectSavePlan(wrongRadius).supported, false);
    const halved = structuredClone(acid); halved.resolution.outcomes.success.damage.multiplier = 0.5;
    assert.equal(executableSplash(halved), false);
    const several = structuredClone(acid); several.targeting.target = '2 creatures';
    assert.equal(executableSplash(several), false);
    // Text naming a splash entry the item doesn't have is refused.
    const source = await fixture('cantrip/acid-splash.json');
    source.system.description.value = source.system.description.value.replace('1 splash acid damage', '2 splash acid damage');
    assert.equal(inspectSavePlan(compileAbility(source)).supported, false);
});

test('splash rolls: splash is split out and never doubled', () => {
    const term = (total, flavor) => ({total, options: flavor ? {flavor} : {}});
    // "(1d6 + 1[splash])[acid]" rolled 5 + 1, and "(1d4[splash])[sonic]" rolled 3.
    const roll = {_evaluated: true, instances: [
        {type: 'acid', persistent: false, total: 6, head: {options: {flavor: 'acid'}, term: {operator: '+', operands: [term(5), term(1, 'splash')]}}},
        {type: 'sonic', persistent: false, total: 3, head: {options: {flavor: 'sonic'}, term: term(3, 'splash')}},
        {type: 'bludgeoning', persistent: false, total: 20, head: term(20)}]};
    const parts = splashParts(roll);
    assert.deepEqual(parts.map(part => [part.type, part.direct, part.splash]), [['acid', 5, 1], ['sonic', 0, 3], ['bludgeoning', 20, 0]]);
    assert.equal(splashFormula(parts, {multiplier: 2}), '{(10 + 1[splash])[acid],(3[splash])[sonic],(40)[bludgeoning]}');
    assert.equal(splashFormula(parts, {multiplier: 1}), '{(5 + 1[splash])[acid],(3[splash])[sonic],(20)[bludgeoning]}');
    assert.equal(splashFormula(parts, {splashOnly: true}), '{(1[splash])[acid],(3[splash])[sonic]}');
    assert.throws(() => splashFormula(parts, {multiplier: 0.5}));
    // Splash inside a product can't be separated.
    assert.throws(() => splashParts({_evaluated: true, instances: [{type: 'acid', total: 4, head: {operator: '*', operands: [term(2), term(2, 'splash')]}}]}));
    // Nearby creatures don't roll; they aren't part of the attack.
    const state = {targets: [{mode: undefined}, {mode: 'splash'}]};
    assert.equal(targetParticipates(state.targets[1]), false);
    assert.equal(splashTargets(state).length, 1);
});
