import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan, isExecutableLingeringPlan, isRestLifetime} from '../scripts/basic-save-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
const effects = (plan, degree) => plan.resolution.outcomes[degree].effects;

test('Interstellar Void: its target is exposed again on each Sustain and is Fatigued while it lasts', async () => {
    const plan = compileAbility(await spell('rank-3/interstellar-void'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.initial, lingering.events, lingering.memberCondition.slug], ['targets', true, ['sustain'], 'fatigued']);
    // A second damage type in the sentence doesn't match the entry: refused.
    const wrong = await spell('rank-3/interstellar-void'); wrong.system.damage['0'].type = 'fire';
    assert.equal(isExecutableLingeringPlan(compileAbility(wrong)), false);
});

test('Eclipse Burst: Blinded for an unlimited duration, only on the condition it follows', async () => {
    const plan = compileAbility(await spell('rank-7/eclipse-burst'));
    // "… plus an additional 8d4 void damage to living creatures": PF2e's void damage already spares undead and constructs, so the
    // item's two entries together are the text (rank 7 batch 2, 2026-10-03; was blocked by the 2026-10-02 preamble audit).
    assert.equal(supported(plan), true);
    assert.ok(!plan.automation.pendingCapabilities.includes('preamble:recipient-qualifier'), JSON.stringify(plan.automation.pendingCapabilities));
    assert.equal(effects(plan, 'criticalFailure').find(effect => effect.slug === 'blinded').duration.mode, 'unlimited');
    // In a table without sentence breaks, the phrase belongs to its own row's condition: row 1's Frightened 2 has no
    // timer (it doesn't take row 5's unlimited duration, nor row 2's "for 1 round").
    // (Since rank 9 batch 8 the table is read by degree: Frightened 2 is the failure's result 1 — a critical failure's 1d4+1 never reaches it.)
    const song = compileAbility(await spell('rank-9/unfathomable-song'));
    assert.equal(effects(song, 'failure').find(effect => effect.slug === 'frightened').duration ?? null, null);
    assert.equal(effects(song, 'criticalFailure').some(effect => effect.slug === 'frightened'), false);
});

test("Heinous Future and Day's Weight: conditions ended or lowered by rest", async () => {
    const heinous = compileAbility(await spell('rank-6/heinous-future'));
    assert.equal(supported(heinous), true, JSON.stringify(inspectSavePlan(heinous).blockers));
    assert.ok(effects(heinous, 'failure').every(effect => isRestLifetime(effect) && effect.endsWhen[0].mode === 'end'));
    assert.ok(effects(heinous, 'criticalFailure').every(effect => isRestLifetime(effect) && effect.endsWhen[0].mode === 'decrement'));
    const days = compileAbility(await spell('rank-3/days-weight'));
    assert.equal(supported(days), true, JSON.stringify(inspectSavePlan(days).blockers));
    assert.deepEqual(effects(days, 'failure').map(effect => `${effect.slug}:${effect.duration.value} ${effect.duration.unit}`), ['fatigued:1 minutes', 'enfeebled:1 minutes']);
    const critical = effects(days, 'criticalFailure');
    assert.ok(isRestLifetime(critical.find(effect => effect.slug === 'fatigued')));
    assert.equal(critical.find(effect => effect.slug === 'enfeebled').duration.unit, 'minutes');
});

test("Mantis's Grasp and Gravity Well", async () => {
    const mantis = compileAbility(await spell('rank-4/mantiss-grasp'));
    assert.equal(supported(mantis), true, JSON.stringify(inspectSavePlan(mantis).blockers));
    const held = effects(mantis, 'criticalFailure')[0];
    assert.deepEqual([held.slug, held.duration.unit, held.endsWhen[0].event, held.expirationMode], ['immobilized', 'minutes', 'escape', 'first']);
    const well = compileAbility(await spell('rank-3/gravity-well'));
    assert.equal(supported(well), true, JSON.stringify(inspectSavePlan(well).blockers));
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => well.resolution.outcomes[degree].forcedMovement.distance), [5, 15, 30]);
    assert.equal(well.resolution.outcomes.success.forcedMovement.direction, 'center');
});

test('a save at the start of each of the target\'s turns is not a one-time save', async () => {
    // (Rank 4 batch 2: it's the lingering workflow's target-turn save, never a one-time save.)
    const plan = compileAbility(await spell('rank-4/haunting-spirit'));
    assert.deepEqual([plan.resolution.lingering?.events, plan.resolution.lingering?.centre], [['turn-start'], 'targets']);
    assert.equal(supported(plan), false);
});
