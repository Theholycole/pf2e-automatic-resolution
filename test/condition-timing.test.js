import assert from 'node:assert/strict';
import test from 'node:test';

import {nativeConditionTiming} from '../scripts/condition-timing.js';

test('the first upcoming turn boundary ends a same-round condition at that turn', () => {
    const cast = {started: true, turn: 1, turnActors: ['before', 'caster', 'after']};
    const duration = {
        mode: 'fixed', value: 1, unit: 'rounds', expiry: 'turn-start',
        anchor: 'target-turn', offset: 0
    };
    assert.deepEqual(nativeConditionTiming(duration, cast, 'caster', 'after'), {
        ...duration, value: 0, originActorUuid: 'after'
    });
    assert.equal(nativeConditionTiming(duration, cast, 'caster', 'before').value, 1);
    assert.equal(nativeConditionTiming(duration, cast, 'caster', 'caster').value, 1);
    assert.equal(nativeConditionTiming({...duration, offset: 1}, cast, 'caster', 'after').value, 0);
    assert.equal(nativeConditionTiming({...duration, offset: undefined}, cast, 'caster', 'after').value, 1);
    assert.throws(() => nativeConditionTiming(duration, cast, 'caster', 'missing'), /ambiguous/);
    // "until the end of its turn" during its own turn (a save at the start of that turn) ends with this turn.
    const endOfTurn = {...duration, expiry: 'turn-end'};
    assert.equal(nativeConditionTiming(endOfTurn, cast, 'caster', 'caster').value, 0);
    assert.equal(nativeConditionTiming(endOfTurn, cast, 'caster', 'before').value, 1);
    assert.equal(nativeConditionTiming({...endOfTurn, offset: 1}, cast, 'caster', 'caster').value, 1);
});

test('caster-anchored and non-turn durations retain their independent clock', () => {
    const cast = {started: true, turn: 1, turnActors: ['before', 'caster', 'after']};
    const sourceTurn = {value: 1, unit: 'rounds', expiry: 'turn-start', anchor: 'source-turn', offset: 1};
    assert.equal(nativeConditionTiming(sourceTurn, cast, 'caster', 'after').value, 1);
    assert.equal(nativeConditionTiming(sourceTurn, cast, 'caster', 'after').originActorUuid, 'caster');
    assert.equal(nativeConditionTiming({...sourceTurn, offset: 0}, cast, 'caster', 'after').value, 1);
    assert.equal(nativeConditionTiming({...sourceTurn, expiry: 'turn-end'}, cast, 'caster', 'after').value, 1);
    assert.equal(nativeConditionTiming({...sourceTurn, anchor: 'effect-start', offset: 0}, cast, 'caster', 'after').value, 1);
    assert.equal(nativeConditionTiming({...sourceTurn, unit: 'minutes', offset: 0}, cast, 'caster', 'after').value, 1);
    assert.equal(nativeConditionTiming({...sourceTurn, offset: 0}, {started: false}, 'caster', 'after').value, 1);
});
