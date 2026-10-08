import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {damageMultiplierForTarget, inspectSavePlan} from '../scripts/basic-save-core.js';

// Third-party batch 24 (2026-10-06): Propagating Arc (Magic+: the target's basic Reflex 2d12; on a failure, a card for the other creatures within 10 feet
// — the text's (rank)d6, basic Reflex — and half for those 10 to 20 feet away, only when one is within 10 feet); Warped Visage (Witches+: Enfeebled 1 or 2
// while sustained; the first Sustain each turn, one ally within 30 feet of a target that failed saves against Frightened, then is immune for 10 minutes).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = name => compileAbility(spell(name), {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Propagating Arc: the target\'s basic save; the spread on a failure, its own text formula, half beyond 10 feet', () => {
    const plan = compile('Propagating Arc');
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.sharedDamage.components.map(component => component.formula), ['2d12']);
    const follow = plan.resolution.areaFollowUp;
    assert.deepEqual([follow.radius, follow.outer, follow.excludeCentre, follow.needsInner, follow.unless], [10, {radius: 20, half: true}, true, true, ['criticalSuccess', 'success']]);
    assert.equal(follow.plan.resolution.sharedDamage.formula, '(@item.rank)d6[electricity]');
    assert.equal(follow.plan.resolution.check.basic, true);
    assert.equal(inspectSavePlan(follow.plan).supported, true);
    // (A creature further out takes half of what its save gives.)
    const state = {outcomes: follow.plan.resolution.outcomes};
    assert.equal(damageMultiplierForTarget(state, {degree: 'failure', shapeHalf: true}), 0.5);
    assert.equal(damageMultiplierForTarget(state, {degree: 'success', shapeHalf: true}), 0.25);
    // (Without the spread's inner distance matching the "at least 1 creature" sentence, it isn't read.)
    const changed = spell('Propagating Arc');
    changed.system.description.value = changed.system.description.value.replace('at least 1 creature within 10 feet', 'at least 1 creature within 15 feet');
    assert.equal(compileAbility(changed, {nativeEffectCatalog: new Map(), referencedSpells: new Map()}).resolution.areaFollowUp, undefined);
});

test('Warped Visage: Enfeebled 1 / 2 while sustained; the Sustain\'s Will save for one of the target\'s allies, with the 10 minutes\' immunity', () => {
    const plan = compile('Warped Visage');
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.lifecycle.sustained, true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`).join()), ['enfeebled 1', 'enfeebled 2']);
    const ally = plan.resolution.sustainAllySave;
    assert.deepEqual([ally.radius, ally.degrees], [30, ['failure', 'criticalFailure']]);
    assert.equal(ally.plan.resolution.check.statistic, 'will');
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => ally.plan.resolution.outcomes[degree].effects.map(effect => `${effect.slug} ${effect.value}`).join()), ['frightened 1', 'frightened 2']);
    assert.equal(ally.plan.resolution.temporaryImmunity.duration.value, 10);
    assert.ok(plan.resolution.reminders.some(reminder => /do not treat the target as an ally while frightened/.test(reminder.text)));
    // (The sustained save without its compiled sentence isn't accepted.)
    const broken = structuredClone(plan); broken.compilerEvidence.sustainAllySave = [];
    assert.equal(inspectSavePlan(broken).supported, false);
});
