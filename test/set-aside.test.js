import assert from 'node:assert/strict';
import test from 'node:test';

import {setAsideDuration} from '../scripts/set-aside-runtime.js';

test('a suspension lasts its fixed time; a suppression until the start of the caster\'s next turn', () => {
    assert.deepEqual(setAsideDuration({mode: 'suspend', duration: {value: 1, unit: 'hours'}}, 'Actor.caster', 'Actor.target', null), {value: 1, unit: 'hours', expiry: null});
    // Out of combat: one round, ending at a turn start.
    assert.deepEqual(setAsideDuration({mode: 'suppress'}, 'Actor.caster', 'Actor.target', null), {value: 1, unit: 'rounds', expiry: 'turn-start'});
    // In combat, the caster's turn still to come this round: it ends at that turn (0 rounds on PF2e's clock).
    const combat = {started: true, turn: 0, turns: [{actor: {uuid: 'Actor.target'}}, {actor: {uuid: 'Actor.caster'}}]};
    assert.deepEqual(setAsideDuration({mode: 'suppress'}, 'Actor.caster', 'Actor.target', combat), {value: 0, unit: 'rounds', expiry: 'turn-start'});
    // The caster acting now: its next turn is next round.
    assert.deepEqual(setAsideDuration({mode: 'suppress'}, 'Actor.caster', 'Actor.target', {...combat, turn: 1}), {value: 1, unit: 'rounds', expiry: 'turn-start'});
});

test('a suppression for the spell\'s own duration', () => {
    assert.deepEqual(setAsideDuration({mode: 'suppress', duration: {value: 2, unit: 'rounds'}}, 'Actor.caster', 'Actor.target', null), {value: 2, unit: 'rounds', expiry: 'turn-start'});
});
