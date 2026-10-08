import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));


// Rebuilt 2026-09-30 from docs/verification/phase-rank-2-batch-1.md after the original file was overwritten by mistake; it covers the same
// four areas the verification lists (the original assertions weren't recoverable).
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('a basic save\'s stated persistent damage entry is part of the roll (Bone Spray, Calcium Rain); another type is refused', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const bone = compileAbility(await spell('rank-2/bone-spray'));
    assert.equal(inspectSavePlan(bone).supported, true);
    const kinds = bone.resolution.sharedDamage.components.map(component => [component.type, component.category]);
    assert.deepEqual(kinds, [['piercing', null], ['bleed', 'persistent']]);
    assert.deepEqual(bone.resolution.outcomes.failure.damage.sourceComponentIds, ['0', '1']);
    assert.equal(inspectSavePlan(compileAbility(await spell('rank-5/calcium-rain'))).supported, true);
    // A persistent phrase that isn't one of the item's damage entries stays an uncompiled signal.
    const fire = compileAbility(withText(await spell('rank-2/bone-spray'), text => text.replace('1 persistent bleed damage', '1 persistent fire damage')));
    assert.equal(inspectSavePlan(fire).supported, false);
});

test('Feral Shades: the GM answers whether the creature is prone or bleeding, for a −2 status penalty to its save', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const shades = compileAbility(await spell('rank-2/feral-shades'));
    assert.equal(inspectSavePlan(shades).supported, true);
    const adjustment = shades.resolution.attackAdjustment ?? shades.resolution.saveAdjustment;
    assert.deepEqual([adjustment.appliesTo, adjustment.modifierType, adjustment.choices.map(choice => choice.value)], ['save', 'status', [-2, 0]]);
    assert.match(adjustment.question, /prone creatures or those taking persistent bleed damage/);
});

test('save adjustments: other phrasings are read; one about a roll result, another save or an item bonus is refused', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    // Firework Blast's "Creatures that critically fail …" is about a roll result: no save adjustment.
    // (It's the second save's penalty on the critical failure's follow-up — rank 3 batch 21.)
    const firework = compileAbility(await spell('rank-3/firework-blast'));
    assert.equal(firework.resolution.attackAdjustment ?? firework.resolution.saveAdjustment ?? null, null);
    assert.deepEqual(firework.resolution.outcomes.criticalFailure.followUps[0].check.modifier.value, -2);
    // An item bonus in the same phrasing is refused.
    const item = compileAbility(withText(await spell('rank-2/feral-shades'), text => text.replace('take a –2 status penalty to the save', 'take a –2 item penalty to the save')));
    assert.equal((item.resolution.attackAdjustment ?? item.resolution.saveAdjustment ?? null)?.modifierType === 'item', false);
});

test('Manifestation of Spirits: "As success, but the effect lasts 1 minute" durations, and a belief clause that states no rule', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compileAbility(await spell('rank-2/manifestation-of-spirits'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const durations = degree => plan.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]);
    assert.deepEqual(durations('success'), [['stupefied', 1, 'rounds']]);
    assert.deepEqual(durations('failure'), [['stupefied', 1, 'minutes']]);
    assert.deepEqual(durations('criticalFailure').map(entry => entry[0]), ['stupefied', 'confused']);
    // A belief that states a rule is refused.
    const rule = compileAbility(withText(await spell('rank-2/manifestation-of-spirits'), text => text.replace('believes every spirit it sees is an imminent threat.', 'believes it must Stride away from every spirit it sees.')));
    assert.equal(inspectSavePlan(rule).supported, false);
});
