import assert from 'node:assert/strict';
import test from 'node:test';

import {stripAsides, splitNameAsides} from '../scripts/gm-notes.js';

// Notes batch 7 (2026-10-05): GM asides taken out of chat cards' text for players (the user: "do the same for asides in chat cards").

test("a card's text without its GM asides", () => {
    assert.equal(stripAsides('Unattended objects in the area take the damage too (the GM moves them). The creature is pushed 10 feet.'),
        'Unattended objects in the area take the damage too. The creature is pushed 10 feet.');
    assert.equal(stripAsides('It is Hidden. The GM deletes this marker to keep it. It then Strides.'), 'It is Hidden. It then Strides.');
    assert.equal(stripAsides('Off-guard until its next turn.'), 'Off-guard until its next turn.');
    // (A sentence that merely mentions the GM's choice elsewhere stays.)
    assert.equal(stripAsides("Pick the color on the card."), "Pick the color on the card.");
});

// Notes batch 9: an Effect name's GM asides go to its description (a name is the same for everyone).
test("an Effect's name without its GM asides", () => {
    assert.deepEqual(splitNameAsides('Shrub wall: cover (the GM judges the line)'), {name: 'Shrub wall: cover', notes: ['The GM judges the line.']});
    assert.deepEqual(splitNameAsides("Objects take damage (the GM's)"), {name: 'Objects take damage', notes: ['Objects take damage — yours to resolve.']});
    assert.deepEqual(splitNameAsides('Heroism'), {name: 'Heroism', notes: []});
});
