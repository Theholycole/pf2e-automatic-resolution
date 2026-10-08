import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';
import {readActionCast} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 23 (2026-10-07): Spellstrikes delivered by other Strikes — Dual-Weapon, Residual, Reverse Spellstrike, Scissored Assault, Big Shot.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('Dual-Weapon Spellstrike: two Strikes, the second at −3 (−2 agile)', () => {
    const read = readSpellshapeFeat(item('Dual-Weapon Spellstrike'));
    assert.deepEqual(read.riders, [{type: 'spellstrike', dual: {penalty: 3, agilePenalty: 2}}]);
    assert.equal(read.requires.inArcaneCascade, true);
    assert.deepEqual(read.requires.table, ['You are wielding both your diametric weapons', 'your Spellstrike is charged']);
});

test('Scissored Assault and Big Shot: other Strikes deliver', () => {
    const scissored = readSpellshapeFeat(item('Scissored Assault'));
    assert.deepEqual([scissored.requires, scissored.riders[0]], [{attack: true, mysticLink: true}, {type: 'spellstrike', kind: 'scissored-assault', striker: 'duo'}]);
    const bigShot = readSpellshapeFeat(item('Big Shot'));
    assert.deepEqual([bigShot.requires.actions, bigShot.requires.attack, bigShot.riders[0]], [[1, 2], true, {type: 'spellstrike', kind: 'big-shot', striker: 'spellgun'}]);
});

test('Residual and Reverse Spellstrike: cast by their cards', () => {
    assert.deepEqual(readActionCast(item('Residual Spellstrike')), {kind: 'residual-spellstrike', name: 'Residual Spellstrike', penalty: 5, agilePenalty: 4,
        table: ['your Strike did not have the fortune trait', 'You are wielding your other diametric weapon']});
    assert.deepEqual(readActionCast(item('Reverse Spellstrike')), {kind: 'reverse-spellstrike', name: 'Reverse Spellstrike', table: ['Your Spellstrike is charged']});
});
