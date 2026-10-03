import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {analyzeResidualProse} from '../src/compiler/residual-prose.js';
import {isExecutableSavePlan} from '../scripts/basic-save-core.js';

const fixture = async path => JSON.parse(await readFile(
    new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));

const originalClause = 'The conviction of a missed cue is only a fleeting notion that passes quickly without any effect on the target.';

function detached(source, clause = originalClause) {
    const copy = structuredClone(source);
    copy._id = 'custom-fleeting-memory';
    delete copy._stats.compendiumSource;
    copy.name = 'Fleeting Memory';
    copy.system.slug = 'fleeting-memory';
    copy.system.description.value = copy.system.description.value.replace(originalClause, clause);
    return copy;
}

test('bounded no-effect narration completes a save with linked Frightened and Slowed', async () => {
    const plan = compileAbility(await fixture('rank-6/missed-cue.json'));
    assert.equal(isExecutableSavePlan(plan), true);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.effects, []);
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.mode, 'none');
    assert.deepEqual(plan.resolution.outcomes.criticalSuccess.semanticCoverage.clauses[0].compiledClaims,
        ['no-effect']);
    for (const [degree, frightened] of [['failure', 2], ['criticalFailure', 3]]) {
        const effects = plan.resolution.outcomes[degree].effects;
        assert.equal(effects.length, 2, degree);
        assert.equal(effects[0].slug, 'frightened');
        assert.equal(effects[0].value, frightened);
        assert.equal(effects[1].slug, 'slowed');
        assert.equal(effects[1].value, 1);
        assert.equal(effects[1].whileCondition, 'frightened');
        assert.deepEqual(effects[1].endsWhen, {event: 'condition-removed', condition: 'frightened'});
    }
});

test('detached renamed spell uses the descriptive grammar rather than spell identity', async () => {
    const source = await fixture('rank-6/missed-cue.json');
    const variant = detached(source,
        'The memory of a forgotten warning is merely a fleeting impression that fades quickly without any effect on the creature.');
    const plan = compileAbility(variant);
    assert.equal(isExecutableSavePlan(plan), true);
    assert.equal(plan.source.name, 'Fleeting Memory');
    assert.equal(plan.resolution.outcomes.criticalSuccess.semanticCoverage.fullyCompiled, true);
});

test('extra mechanics or a nonempty outcome cannot be claimed as harmless narration', async () => {
    const source = await fixture('rank-6/missed-cue.json');
    for (const extra of [
        ' The target gains 1 action.',
        ' The target takes 1d4 fire damage.',
        ' The target becomes frightened 1.',
        ' The target is pushed 5 feet.'
    ]) {
        const plan = compileAbility(detached(source, `${originalClause}${extra}`));
        assert.equal(isExecutableSavePlan(plan), false, extra);
    }
    const outcome = {
        rawText: originalClause,
        damage: {mode: 'none', multiplier: 0, sourceComponentIds: []},
        effects: [{kind: 'condition', slug: 'frightened', name: 'Frightened', value: 1}],
        nativeEffects: [], followUps: [], decisions: [], manualInstructions: [], terminal: null
    };
    assert.equal(analyzeResidualProse(outcome).fullyCompiled, false);
    outcome.effects = [];
    outcome.damage = {mode: 'shared', multiplier: 1, sourceComponentIds: ['0']};
    assert.equal(analyzeResidualProse(outcome).fullyCompiled, false);
});

test('other residual no-effect wording does not unlock uncompiled ongoing or trait mechanics', async () => {
    // A recurring save and hydration choice outside the persistent follow-up form (Dehydrate's additional save moved to the start of each turn)
    // stay uncompiled; batch 128 compiles Dehydrate's own text.
    let dehydrate = await fixture('rank-1/dehydrate.json');
    dehydrate.system.description.value = dehydrate.system.description.value.replace('at the end of each of its turns', 'at the start of each of its turns');
    dehydrate = compileAbility(dehydrate);
    assert.equal(isExecutableSavePlan(dehydrate), false);
    // Gritty Wheeze's water/plant shift is now a compiled trait adjustment,
    // not a discarded clause.
    const wheeze = compileAbility(await fixture('rank-1/gritty-wheeze.json'));
    assert.deepEqual(wheeze.resolution.degreeAdjustment.predicate, {kind: 'trait-any', traits: ['water', 'plant']});
});

test('combined inline persistent damage claims require an exact degree proof', () => {
    const rawText = 'The creature takes double void damage and double persistent bleed damage.';
    const damage = {mode: 'mixed', shared: {multiplier: 2, sourceComponentIds: ['0']},
        formulas: [{formula: '(2*(@item.level))[persistent,bleed]', source: 'description-inline'}],
        rollScope: 'combined'};
    const outcome = {rawText, damage, effects: [], nativeEffects: [], followUps: []};
    const proof = {kind: 'inline-persistent-plus-structured', persistentType: 'bleed',
        sourceFormula: '(@item.level)[bleed]', directComponentIds: ['0'],
        sourceText: {criticalFailure: rawText}, byDegree: {criticalFailure: structuredClone(damage)}};
    assert.equal(analyzeResidualProse(outcome).fullyCompiled, false);
    assert.equal(analyzeResidualProse(outcome, {degree: 'criticalFailure', inlinePersistentProof: proof}).fullyCompiled, true);
    proof.byDegree.criticalFailure.formulas[0].formula = '(3*(@item.level))[persistent,bleed]';
    assert.equal(analyzeResidualProse(outcome, {degree: 'criticalFailure', inlinePersistentProof: proof}).fullyCompiled, false);
    proof.byDegree.criticalFailure = structuredClone(damage);
    proof.sourceText.criticalFailure = `${rawText} The target loses 1 action.`;
    assert.equal(analyzeResidualProse(outcome, {degree: 'criticalFailure', inlinePersistentProof: proof}).fullyCompiled, false);
});
