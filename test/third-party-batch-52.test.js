import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

// Third-party batch 52 (2026-10-07): Mind's Eye Wink (Oracles+) — the area: a lingering Will save in the GM's drawn squares (in it when cast, or entering), Stupefied 1
// while inside and 1 round after leaving (a critical failure Stupefied 2 inside, 1 after), disbelief by Seeking; the object: the holder's save on the card.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test("Mind's Eye Wink: the area's lingering save and the object's", () => {
    const plan = compile(spell("Mind's Eye Wink"));
    assert.equal(plan.resolution.kind, 'dream-hazard');
    const {areaPlan, object} = plan.resolution.dreamHazard;
    assert.ok(isExecutableLingeringPlan(areaPlan));
    const lingering = areaPlan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.drawnArea, lingering.disbelief.statistic], [['enter'], true, 'placed', '4 contiguous 5-foot squares', 'perception']);
    const [failure] = areaPlan.resolution.outcomes.failure.noteEffects, [critical] = areaPlan.resolution.outcomes.criticalFailure.noteEffects;
    assert.deepEqual([failure.whileInArea, failure.afterLeaveRounds, failure.rules[0].alterations[0].value, failure.afterLeaveRules], [true, 1, 1, undefined]);
    assert.deepEqual([critical.rules[0].alterations[0].value, critical.afterLeaveRules[0].alterations[0].value], [2, 1]);
    assert.deepEqual([object.statistic, object.penalty], ['will', {failure: 1, criticalFailure: 2}]);
});
