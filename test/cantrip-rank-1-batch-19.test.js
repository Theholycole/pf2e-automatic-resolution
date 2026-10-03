import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource, validNoteEffect, validNoteRule} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Sleep: Unconscious until it wakes automatically, a generated Perception penalty, and a rank gate', async () => {
    const sleep = compileAbility(await spell('rank-1/sleep'));
    assert.equal(inspectSavePlan(sleep).supported, true, JSON.stringify(inspectSavePlan(sleep).blockers));
    const failure = sleep.resolution.outcomes.failure, critical = sleep.resolution.outcomes.criticalFailure;
    assert.deepEqual([failure.effects[0].slug, failure.effects[0].duration.value, failure.effects[0].duration.unit, critical.effects[0].duration.unit], ['unconscious', 1, 'minutes', 'hours']);
    assert.match(failure.noteEffects[0].text, /wakes up automatically.*wake earlier/);
    const penalty = sleep.resolution.outcomes.success.noteEffects[0];
    assert.deepEqual([penalty.label, penalty.rules, penalty.duration.value, penalty.duration.unit], ['Perception penalty', [{key: 'FlatModifier', selector: 'perception', type: 'status', value: -1}], 1, 'rounds']);
    assert.ok(validNoteEffect(penalty));
    const source = prepareNoteEffectSource(penalty, {castId: 'c', castRank: 1, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'Sleep', targetActorUuid: 'T'});
    assert.deepEqual(source.system.rules, [{key: 'FlatModifier', selector: 'perception', type: 'status', value: -1, label: 'Sleep'}]);
    // Heightened (4th) changes the rows: from 4th rank the heightened rows apply (1 round / 1 minute, Prone; batch rank-2-16).
    assert.equal(sleep.resolution.rankGate, undefined);
    assert.deepEqual(sleep.resolution.heightenedVariants.map(variant => [variant.minRank, variant.outcomes.failure.effects.map(effect => effect.slug)]), [[4, ['unconscious', 'prone']]]);
});

test('rank gates also cover enabled spells whose heightened rows the plan does not read', async () => {
    const visage = compileAbility(await spell('rank-3/horrific-visage'));
    assert.equal(inspectSavePlan(visage).supported, true);
    assert.equal(visage.resolution.rankGate.minRank, 5);
    // A heightened entry the plan reads (a duration) needs no gate.
    assert.equal(compileAbility(await spell('cantrip/tangle-vine')).resolution.rankGate, undefined);
});

test('row penalties and gates: kept strict', async () => {
    assert.equal(validNoteRule({key: 'FlatModifier', selector: 'perception', type: 'item', value: -1}), false);
    assert.equal(validNoteRule({key: 'FlatModifier', selector: 'perception', type: 'status', value: -5}), false);
    const sleep = await spell('rank-1/sleep');
    // A penalty to an unknown statistic stays unaccounted.
    assert.equal(inspectSavePlan(compileAbility(withText(sleep, text => text.replace('Perception checks for 1 round', 'spell DCs for 1 round')))).supported, false);
    // A heightened variant that doesn't start above the spell's rank is refused.
    const tampered = compileAbility(sleep); tampered.resolution.heightenedVariants[0].minRank = 1;
    assert.equal(inspectSavePlan(tampered).supported, false);
});
