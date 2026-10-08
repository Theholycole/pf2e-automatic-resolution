import assert from 'node:assert/strict';
import test from 'node:test';

import {damagePools, plainDice} from '../scripts/text-spell-damage.js';

// Spell features batch 1 (2026-10-05): a text-built damage formula read into PF2e damage entries (so the caster's spell-damage rules apply).

test('formulas into damage entries', () => {
    assert.deepEqual(damagePools('(2+floor((@item.rank - 3)/2)*1)d10[mental]'), [{formula: '(2+floor((@item.rank - 3)/2)*1)d10', type: 'mental', category: null}]);
    assert.deepEqual(damagePools('{(3+2*(@item.rank - 4))d6[piercing],2d6[persistent,fire]}'),
        [{formula: '(3+2*(@item.rank - 4))d6', type: 'piercing', category: null}, {formula: '2d6', type: 'fire', category: 'persistent'}]);
    assert.deepEqual(damagePools('(50)[bludgeoning]'), [{formula: '50', type: 'bludgeoning', category: null}]);
    assert.deepEqual(damagePools('(1d4)+(2)[fire]'), [{formula: '(1d4)+(2)', type: 'fire', category: null}]);
    assert.equal(damagePools('2d6'), null);
    assert.equal(damagePools('2d6[splash,fire]'), null);
});

test('dice counts worked out at the cast rank', () => {
    assert.equal(plainDice('(2+floor((@item.rank - 3)/2)*1)d10', 4), '2d10');
    assert.equal(plainDice('(3+2*(@item.rank - 4))d6', 6), '7d6');
    assert.equal(plainDice('(6+2*min(1,floor(@item.rank/9)))d8', 9), '8d8');
    assert.equal(plainDice('50', 3), '50');
    assert.equal(plainDice('2d6', 3), '2d6');
    assert.equal(plainDice('@actor.level', 3), null);
});
