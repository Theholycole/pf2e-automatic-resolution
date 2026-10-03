import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {parseAfflictionBlock} from '../src/compiler/affliction-handoff.js';
import {inspectSavePlan, isAfflictionHandoffPlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const DEGREES = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
const damageShape = plan => DEGREES.map(degree => {
    const damage = plan.resolution.outcomes[degree].damage;
    return damage.mode === 'mixed' ? `mixed${damage.shared.multiplier}` : damage.mode === 'formulas' ? 'formulas' : `${damage.mode}${damage.multiplier}`;
});
const stages = plan => DEGREES.map(degree => plan.resolution.outcomes[degree].affliction?.stage ?? 0);

function detached(original, description = original.system.description.value) {
    const item = structuredClone(original);
    item._id = 'custom-affliction1';
    if (item._stats) delete item._stats.compendiumSource;
    item.name = 'Custom Affliction Spell';
    item.system.slug = 'custom-affliction-spell';
    item.system.description.value = description;
    return item;
}

test('the stage block is parsed from the description after the degree table', async () => {
    const block = parseAfflictionBlock((await fixture('rank-1/spider-sting.json')).system.description.value);
    assert.equal(block.name, 'Spider Venom');
    assert.deepEqual(block.traits, ['poison']);
    assert.equal(block.maximumDuration, '4 rounds');
    assert.equal(block.stages.length, 2);
    const heading = parseAfflictionBlock((await fixture('rank-6/crimson-breath.json')).system.description.value);
    assert.equal(heading.name, 'Breath of the Mantis God');
    assert.equal(heading.stages.length, 3);
});

test('touch delivery damage applies at every degree; the stage handoff starts at the written stage', async () => {
    for (const path of ['rank-1/spider-sting.json', 'rank-6/purple-worm-sting.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        assert.ok(isAfflictionHandoffPlan(plan), path);
        assert.deepEqual(damageShape(plan), ['shared1', 'mixed1', 'shared1', 'shared1'], path);
        assert.deepEqual(stages(plan), [0, 0, 1, 2], path);
        assert.ok(plan.compilerEvidence.afflictionDelivery.sentence.startsWith('You deal'), path);
    }
    // Purple Worm's success poison damage has no structured component: plain outcome dice.
    const worm = compileAbility(await fixture('rank-6/purple-worm-sting.json'));
    assert.deepEqual(worm.resolution.outcomes.success.damage.formulas.map(entry => entry.formula), ['3d6[poison]']);
});

test('degree damage and afflictions compose with typed full/double shared damage', async () => {
    const chestnuts = compileAbility(await fixture('rank-4/blood-chestnuts.json'));
    assert.equal(inspectSavePlan(chestnuts).supported, true);
    assert.deepEqual(damageShape(chestnuts), ['none0', 'shared0.5', 'shared1', 'shared2']);
    assert.deepEqual(stages(chestnuts), [0, 0, 1, 2]);
    const bottle = compileAbility(await fixture('rank-5/blinding-bottle.json'));
    assert.deepEqual(damageShape(bottle), ['none0', 'shared1', 'none0', 'none0'], 'the success dice are the structured component');
    for (const path of ['rank-1/divine-plagues.json', 'rank-2/advanced-scurvy.json', 'rank-6/crimson-breath.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        assert.deepEqual(stages(plan), [0, 0, 1, 2], path);
    }
});

test('unproved affliction references, lifecycles and gated delivery stay blocked', async () => {
    const sting = await fixture('rank-1/spider-sting.json');
    const renamed = compileAbility(detached(sting, sting.system.description.value.replace('afflicted with spider venom at stage 1', 'afflicted with wasp venom at stage 1')));
    assert.ok(renamed.automation.pendingCapabilities.includes('affliction-handoff:affliction-name'));
    const tooDeep = compileAbility(detached(sting, sting.system.description.value.replace('spider venom at stage 2', 'spider venom at stage 3')));
    assert.equal(inspectSavePlan(tooDeep).supported, false);
    // A sustained disease the text doesn't tie to the spell (rank-3 batch 82 hands off the one that ends when the spell ends).
    const malady = await fixture('rank-3/mycological-malady.json');
    assert.ok(compileAbility(detached(malady, malady.system.description.value.replace('This disease ends when the spell ends;', ''))).automation.pendingCapabilities.includes('affliction-handoff:lifecycle'));
    // Delivery damage that no rule ties to the outcomes is never silently dropped.
    const wyvern = await fixture('rank-5/wyvern-sting.json');
    const unbound = inspectSavePlan(compileAbility(detached(wyvern, wyvern.system.description.value
        .replace('If the target takes piercing damage, they must attempt a Fortitude save.', 'The target must attempt a Fortitude save if it is bleeding.'))));
    assert.equal(unbound.supported, false);
    assert.ok(unbound.blockers.some(blocker => blocker.code === 'unused-shared-damage'));
});

test('a handoff without the delegated capability or with an out-of-range stage is rejected by the core', async () => {
    const plan = compileAbility(await fixture('rank-1/spider-sting.json'));
    const tampered = structuredClone(plan);
    tampered.resolution.outcomes.failure.affliction.stage = 9;
    assert.equal(isAfflictionHandoffPlan(tampered), false);
    assert.equal(inspectSavePlan(tampered).supported, false);
    const undelegated = structuredClone(plan);
    undelegated.automation.delegatedCapabilities = [];
    assert.equal(isAfflictionHandoffPlan(undelegated), false);
});

test('damage-gated delivery: the delivery applies at every degree and gates the rest', async () => {
    for (const path of ['rank-2/imp-sting.json', 'rank-5/wyvern-sting.json', 'rank-7/leng-sting.json', 'rank-9/linnorm-sting.json', 'rank-4/swarming-wasp-stings.json']) {
        const plan = compileAbility(await fixture(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        assert.deepEqual(plan.resolution.damageGate, {requires: 'shared-damage-taken', damageType: 'piercing'}, path);
        assert.deepEqual(stages(plan), [0, 0, 1, 2], path);
        assert.ok(DEGREES.every(degree => ['shared', 'mixed'].includes(plan.resolution.outcomes[degree].damage.mode)), path);
    }
    // Imp Sting's gated 1d6 spirit damage is part of every degree.
    const imp = compileAbility(await fixture('rank-2/imp-sting.json'));
    assert.ok(DEGREES.every(degree => imp.resolution.outcomes[degree].damage.formulas[0].formula === '1d6[spirit]'));
    // Swarming Wasp Stings' "10-foot burst" target entry is an area.
    assert.equal(compileAbility(await fixture('rank-4/swarming-wasp-stings.json')).targeting.actorConstraints.complete, true);
});

test('basic-save affliction rider, a block before the table, trait immunity and implied condition value', async () => {
    const blast = compileAbility(await fixture('rank-7/blightburn-blast.json'));
    assert.equal(inspectSavePlan(blast).supported, true);
    assert.deepEqual(stages(blast), [0, 0, 1, 2]);
    assert.equal(blast.resolution.afflictionHandoff.name, 'Blightburn Sickness');
    const pox = compileAbility(await fixture('rank-1/goblin-pox.json'));
    assert.equal(inspectSavePlan(pox).supported, true);
    assert.deepEqual(pox.resolution.afflictionHandoff.immunity.traits, ['goblin']);
    assert.equal(pox.resolution.afflictionHandoff.immunity.others, 'goblin dogs');
    const insurrection = compileAbility(await fixture('rank-4/internal-insurrection.json'));
    assert.equal(inspectSavePlan(insurrection).supported, true);
    assert.deepEqual(insurrection.resolution.outcomes.success.effects.map(effect => [effect.slug, effect.value, effect.impliedValue]), [['clumsy', 1, true]]);
});

test('degree-scoped immunity, a per-rank damage with a save penalty, anatomy targets and vehicle narration', async () => {
    const bomb = compileAbility(await fixture('rank-3/blister-bomb.json'));
    assert.equal(inspectSavePlan(bomb).supported, true);
    assert.deepEqual(bomb.resolution.outcomes.criticalSuccess.afflictionImmunity.duration, {value: 7, unit: 'days'});
    const plague = compileAbility(await fixture('rank-5/abyssal-plague.json'));
    assert.equal(inspectSavePlan(plague).supported, true);
    assert.equal(plague.resolution.outcomes.success.damage.formulas[0].formula, '(2*@item.rank)[spirit]');
    assert.deepEqual([plague.resolution.outcomes.success.afflictionSavePenalty.value, plague.resolution.outcomes.success.afflictionSavePenalty.duration.unit], [-2, 'days']);
    const moth = compileAbility(await fixture('rank-3/bone-moths-kiss.json'));
    assert.equal(inspectSavePlan(moth).supported, true);
    assert.equal(moth.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    assert.deepEqual(moth.compilerEvidence.narrativeNouns, ['moth']);
    // Narration about anything the spell didn't introduce stays residual.
    const source = await fixture('rank-3/bone-moths-kiss.json');
    const stray = compileAbility(detached(source, source.system.description.value.replace('The moth only briefly brushes', 'The moon only briefly brushes')));
    assert.equal(inspectSavePlan(stray).supported, false);
    // Tampered immunity or penalty shapes are rejected by the core.
    const tampered = structuredClone(plague);
    tampered.resolution.outcomes.success.afflictionSavePenalty.value = 2;
    assert.equal(isAfflictionHandoffPlan(tampered), false);
});

test('a value written after a bare condition link is never implied as 1', async () => {
    const wails = compileAbility(await fixture('rank-9/wails-of-the-damned.json'));
    // "Drained [[/r 1d4]]" is rolled for each creature at Finalize; it's never taken as 1.
    const drained = wails.resolution.outcomes.failure.effects.find(effect => effect.slug === 'drained');
    assert.equal(drained?.value ?? null, null);
    assert.equal(drained.valueRoll, '1d4');
    assert.equal(inspectSavePlan(wails).supported, true);
});
