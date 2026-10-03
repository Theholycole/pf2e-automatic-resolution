import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 2, batch 8 (2026-09-30): rows that read the initial and the introduction's inline persistent damage apart (Acid Grip, Combustion),
// the caster's move in a direction of their choice, and a Speed penalty Effect that lasts with the persistent damage.

test('Acid Grip: half / full / double initial damage, persistent on failure rows (not doubled), the caster\'s move and the linked Speed Effect', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/acid-grip'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {criticalSuccess, success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(criticalSuccess.damage.mode, 'none');
    assert.deepEqual([success.damage.mode, success.damage.multiplier], ['shared', 0.5]);
    assert.deepEqual([failure.damage.shared.multiplier, failure.damage.formulas[0].formula], [1, '(floor(@item.level/2))d6[persistent,acid]']);
    // "double damage and full persistent damage": the persistent amount isn't doubled.
    assert.deepEqual([criticalFailure.damage.shared.multiplier, criticalFailure.damage.formulas[0].formula], [2, '(floor(@item.level/2))d6[persistent,acid]']);
    assert.deepEqual([success, failure, criticalFailure].map(outcome => [outcome.forcedMovement.distance, outcome.forcedMovement.optional, outcome.forcedMovement.direction]),
        [[5, true, 'any'], [10, true, 'any'], [20, true, 'any']]);
    // PF2e's Spell Effect (−10 status to all Speeds while taking persistent acid) on the rows that deal persistent damage only.
    assert.deepEqual([success, failure, criticalFailure].map(outcome => (outcome.nativeEffects ?? []).map(effect => [effect.reference, effect.outcomeRule.kind, effect.outcomeRule.damageType])),
        [[], [['Spell Effect: Acid Grip', 'persistent-linked-effect', 'acid']], [['Spell Effect: Acid Grip', 'persistent-linked-effect', 'acid']]]);
    assert.equal(plan.nativeEffects.unscoped.length, 0);
    for (const outcome of [success, failure, criticalFailure]) assert.ok(outcome.semanticCoverage.clauses.every(clause => clause.status === 'compiled'));
});

test('Combustion: its fixed persistent amount grows with the heightened rank, and doubles on a critical failure', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-3/combustion'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(failure.damage.formulas[0].formula, '(@item.level - 1)d6[persistent,fire]');
    assert.equal(criticalFailure.damage.formulas[0].formula, '(2*((@item.level - 1)d6))[persistent,fire]');
    assert.equal(failure.forcedMovement, undefined);
});

test('Inline persistent rows: a mismatched heightened entry or Effect leaves the plan unproven', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    // The heightened persistent increase disagrees with the formula.
    const wrongStep = compile(withText(await spell('rank-3/combustion'), html => html.replace('@Damage[1d6[fire]]', '@Damage[1d8[fire]]')));
    assert.equal(inspectSavePlan(wrongStep).supported, false);
    // A different Speed penalty than PF2e's Effect gives.
    const wrongSpeed = compile(withText(await spell('rank-2/acid-grip'), html => html.replace('–10-foot', '–15-foot')));
    assert.equal(inspectSavePlan(wrongSpeed).supported, false);
    // The linked Effect's Speed penalty must be predicated on the linked persistent damage: linked to fire, the acid predicate is refused.
    const {inspectCompiledNativeOutcomeEffect} = await import('../scripts/native-outcome-effects.js');
    const effect = structuredClone(compile(await spell('rank-2/acid-grip')).resolution.outcomes.failure.nativeEffects[0]);
    assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree: 'failure'}).supported, true);
    effect.outcomeRule.damageType = 'fire';
    assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree: 'failure'}).supported, false);
    // Without the new rule, a row that says it deals persistent damage but doesn't is left unclaimed (Combustion's old plan).
    const {analyzeResidualProse} = await import('../src/compiler/residual-prose.js');
    const row = {rawText: 'The creature takes full damage, as well as full persistent damage.', damage: {mode: 'shared', multiplier: 1, sourceComponentIds: ['0']}, effects: []};
    assert.equal(analyzeResidualProse(row, {degree: 'failure', persistentComponentIds: []}).clauses[0].status, 'residual');
    assert.equal(analyzeResidualProse({...row, rawText: 'The creature takes half damage and no persistent damage.'}, {degree: 'success', persistentComponentIds: []}).clauses[0].status, 'compiled');
});
