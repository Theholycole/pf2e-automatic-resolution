import assert from 'node:assert/strict';
import test from 'node:test';

import {isEssenceSpell, isDrawCantrip} from '../scripts/essence-runtime.js';

// Third-party features batch 27 (2026-10-07): Magic+'s essence casting — which casts are essence spells and draw cantrips (the encounter, cycles and termini are live).
const spell = (traits, actions) => ({system: {traits: {value: traits}, time: {value: actions}}});

test('essence spells and draw cantrips', () => {
    assert.equal(isEssenceSpell(spell(['essence', 'fire'], '2')), true);
    assert.equal(isEssenceSpell(spell(['essence', 'cantrip'], '2')), false);
    assert.equal(isEssenceSpell(spell(['fire'], '2')), false);
    // ("Ordinary cantrips that use 2 actions or more (not focus cantrips …)")
    assert.equal(isDrawCantrip(spell(['cantrip', 'electricity'], '2')), true);
    assert.equal(isDrawCantrip(spell(['cantrip'], '1')), false);
    assert.equal(isDrawCantrip(spell(['cantrip', 'focus'], '2')), false);
});
