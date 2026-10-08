import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan, synchronizeSecondary, gmQuestionGates} from '../scripts/basic-save-core.js';

// Third-party batch 31 (2026-10-06): Unhelpful Nudge (Magic+: a failed Reflex save — pushed 10 feet where the caster chooses during the Stride; if the GM says it
// was pushed into a creature or object, its second Reflex save: Prone on a failure).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Unhelpful Nudge: the failures push 10 feet (the caster\'s direction); the collision save opens only on the GM\'s yes', () => {
    const plan = compile(spell('Unhelpful Nudge'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['failure', 'criticalFailure']) {
        const outcome = plan.resolution.outcomes[degree];
        assert.deepEqual([outcome.forcedMovement.kind, outcome.forcedMovement.distance, outcome.forcedMovement.direction], ['push', 10, 'chosen']);
        assert.deepEqual(outcome.followUps[0].outcomes.failure.effects.map(effect => effect.slug), ['prone']);
    }
    assert.equal(plan.resolution.outcomes.success.forcedMovement ?? null, null);
    const state = {outcomes: plan.resolution.outcomes};
    const target = {degree: 'failure'};
    assert.equal(gmQuestionGates(state, target)[0].question, 'Was it pushed into another creature or object?');
    assert.equal(synchronizeSecondary(state, target), null);
    target.gateAnswer = {answer: 'yes'};
    assert.equal(synchronizeSecondary(state, target).followUpId, 'collision-failure');
});
