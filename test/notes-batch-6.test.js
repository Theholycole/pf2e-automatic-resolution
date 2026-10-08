import assert from 'node:assert/strict';
import test from 'node:test';

import {splitAsides} from '../scripts/gm-notes.js';

// Notes batch 6 (2026-10-05): GM asides in a player's text split into GM notes of their own (the user: "split those asides into separate GM notes").

test('a GM aside in parentheses: out of the sentence, into a note', () => {
    const split = splitAsides("The shrubs give standard cover to a creature behind them (the GM judges the line of the attack).");
    assert.equal(split.html, 'The shrubs give standard cover to a creature behind them.');
    assert.deepEqual(split.notes, ['The GM judges the line of the attack.']);
});

test("a bare aside — (the GM's) — keeps its sentence in the note", () => {
    const split = splitAsides("Objects in the area take the damage too (the GM's). The creature is pushed 10 feet.");
    assert.equal(split.html, 'Objects in the area take the damage too. The creature is pushed 10 feet.');
    assert.deepEqual(split.notes, ['Objects in the area take the damage too — yours to resolve.']);
});

test('a sentence for the GM moves whole; text with no GM stays as it was', () => {
    const split = splitAsides('<strong>Hidden</strong> until your turn ends. The GM deletes this marker to keep it.');
    assert.equal(split.html, '<strong>Hidden</strong> until your turn ends.');
    assert.deepEqual(split.notes, ['The GM deletes this marker to keep it.']);
    assert.deepEqual(splitAsides('Off-guard until the start of its next turn.'), {html: 'Off-guard until the start of its next turn.', notes: []});
});
