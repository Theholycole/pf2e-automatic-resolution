import assert from 'node:assert/strict';
import test from 'node:test';

import {degreeOf} from '../scripts/runtime-utils.js';
import {counters} from '../scripts/casting-rules-runtime.js';

// Spell features batch F6 (2026-10-05): the counteract checks of Reflecting Shield (+30, rank 9) and Spell Duelist's Siphon.

test('a counteract check: its degree against the spell DC, the natural 20 and 1', () => {
    assert.equal(degreeOf(34, 24, 4), 3);
    assert.equal(degreeOf(24, 24, 4), 2);
    assert.equal(degreeOf(20, 24, 20), 2);
    assert.equal(degreeOf(14, 24, 10), 0);
    assert.equal(degreeOf(31, 24, 1), 1);
});

test("Reflecting Shield's rank 9: a rank-1 spell countered even on a failure (not a critical failure); rank 10 on a critical success, not rank 11 on a success", () => {
    assert.equal(counters(degreeOf(35, 40, 5), 9, 1), true);
    assert.equal(counters(degreeOf(30, 40, 5), 9, 1), false);
    assert.equal(counters(degreeOf(35, 24, 5), 9, 10), true);
    assert.equal(counters(degreeOf(30, 24, 5), 9, 11), false);
});
