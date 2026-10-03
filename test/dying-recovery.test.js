import assert from 'node:assert/strict';
import test from 'node:test';

import {isDying, recoverFromDying, revivedNote} from '../scripts/dying-recovery.js';

// A minimal actor with PF2e's condition API.
function actor({hp, dying = 0, wounded = 0, unconscious = false}) {
    const conditions = new Map([['dying', dying], ['wounded', wounded], ['unconscious', unconscious ? 1 : 0]]);
    return {
        hitPoints: {value: hp},
        hasCondition: slug => (conditions.get(slug) ?? 0) > 0,
        getCondition: slug => (conditions.get(slug) ?? 0) > 0 ? {value: conditions.get(slug)} : null,
        decreaseCondition: async (slug, {forceRemove} = {}) => { conditions.set(slug, forceRemove ? 0 : Math.max(0, conditions.get(slug) - 1)); },
        increaseCondition: async slug => { conditions.set(slug, (conditions.get(slug) ?? 0) + 1); },
        conditions
    };
}

test('healed back from Dying: Dying and Unconscious end, Wounded rises', async () => {
    const a = actor({hp: 7, dying: 2, wounded: 1, unconscious: true});
    const revived = await recoverFromDying(a, true);
    assert.deepEqual(revived, {woundedBefore: 1, woundedAfter: 2, woundedRaised: true});
    assert.equal(a.conditions.get('dying'), 0);
    assert.equal(a.conditions.get('unconscious'), 0);
    assert.match(revivedNote(revived), /Wounded 1 → 2\.$/);
});

test('a spell that keeps Wounded, and cases that change nothing', async () => {
    const kept = actor({hp: 3, dying: 1, unconscious: true});
    const revived = await recoverFromDying(kept, true, {keepWounded: true});
    assert.deepEqual(revived, {woundedBefore: 0, woundedAfter: 0, woundedRaised: false});
    assert.match(revivedNote(revived), /doesn't increase it/);
    // Still at 0 HP: Dying stays.
    const zero = actor({hp: 0, dying: 1});
    assert.equal(await recoverFromDying(zero, true), null);
    assert.equal(zero.conditions.get('dying'), 1);
    // Not dying before the healing: nothing to recover from.
    const awake = actor({hp: 20});
    assert.equal(isDying(awake), false);
    assert.equal(await recoverFromDying(awake, false), null);
    assert.equal(awake.conditions.get('wounded'), 0);
});
