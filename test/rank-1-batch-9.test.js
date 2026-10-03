import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));

test('Corpse Bloom: three separate bursts, turn-start and a once-per-round enter, damage scaled by the table', async () => {
    const plan = compileAbility(await spell('rank-1/corpse-bloom'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.oncePerRound, lingering.enterOncePerRound, lingering.areaCount, lingering.separateAreas],
        [['enter', 'turn-start'], false, false, true, 3, true]);
    const exposure = lingeringExposurePlan(plan);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => exposure.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`).join()),
        ['sickened 1', 'sickened 1', 'sickened 2']);
    // A count paragraph that doesn't match the item's area, or an unread one, blocks the spell.
    const wrong = await spell('rank-1/corpse-bloom');
    wrong.system.description.value = wrong.system.description.value.replace('three 5-foot bursts', 'three 10-foot bursts');
    const wrongPlan = compileAbility(wrong);
    assert.equal(isExecutableLingeringPlan(wrongPlan), false);
    assert.ok(wrongPlan.automation.pendingCapabilities.includes('area-paragraph'));
    // Another noun than the areas' own ("a wall") isn't a trigger.
    const other = await spell('rank-1/corpse-bloom');
    other.system.description.value = other.system.description.value.replace('enters a cluster', 'enters a wall');
    assert.equal(isExecutableLingeringPlan(compileAbility(other)), false);
});

test('Noxious Vapors: a 1-round concealing cloud, exposed on casting except for you, with a critical-failure rider', async () => {
    const plan = compileAbility(await spell('rank-1/noxious-vapors'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.excludeCaster, lingering.concealment, lingering.centre, lingering.endsAt, lingering.notes],
        [[], true, true, true, 'caster', 'caster-turn-start', ['This smoke can be dispersed by a strong wind.']]);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    assert.deepEqual(exposure.resolution.outcomes.criticalFailure.effects.map(effect => `${effect.slug} ${effect.value}`), ['sickened 1']);
    assert.equal(exposure.resolution.outcomes.failure.effects.length, 0);
    // Without the concealment sentence it's an ordinary area save, not a lingering one.
    const plain = await spell('rank-1/noxious-vapors');
    plain.system.description.value = plain.system.description.value.replace(/All creatures in the area become[^.]*\./, '');
    assert.equal(compileAbility(plain).resolution.lingering, undefined);
    // A dispersal note in any other wording is refused.
    const windy = await spell('rank-1/noxious-vapors');
    windy.system.description.value = windy.system.description.value.replace('can be dispersed by a strong wind', 'can be dispersed by a strong wind or by fire');
    assert.equal(isExecutableLingeringPlan(compileAbility(windy)), false);
});
