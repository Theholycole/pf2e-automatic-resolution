import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {nativeConditionTiming} from '../scripts/condition-timing.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));

test('Genie\'s Veil: Concealed until the end of the current creature\'s turn', async () => {
    const veil = compileAbility(await spell('rank-1/genies-veil'));
    assert.equal(veil.resolution.kind, 'condition-note');
    const note = veil.resolution.conditionNote;
    assert.deepEqual([note.recipient, note.condition.slug, note.duration.anchor, note.duration.expiry], ['target', 'concealed', 'current-turn', 'turn-end']);
    // In combat: 0 rounds from the acting creature (it ends as that turn does); out of combat, a round.
    const cast = {started: true, turn: 1, turnActors: ['Actor.a', 'Actor.b', 'Actor.c']};
    assert.deepEqual(nativeConditionTiming(note.duration, cast, 'Actor.caster', 'Actor.t'), {...note.duration, value: 0, originActorUuid: 'Actor.b'});
    assert.equal(nativeConditionTiming(note.duration, {started: false}, 'Actor.caster', 'Actor.t').value, 1);
});

test('condition mentions: Stealth options, a path that may be invisible, "if a target is Concealed or Hidden"', async () => {
    assert.equal(compileAbility(await spell('cantrip/glowing-trail')).resolution.kind, 'spell-note');
    // (Omnidirectional Scan and Dim the Light are automated since batch 169: the conditions stay mentions, not conditions applied.)
    assert.equal(compileAbility(await spell('cantrip/omnidirectional-scan')).resolution.kind, 'aid-attack');
    assert.equal(compileAbility(await spell('rank-1/dim-the-light')).resolution.kind, 'hide-reaction');
    // A size-dependent condition on a creature isn't a mention (Stick On).
    assert.notEqual(compileAbility(await spell('rank-1/stick-on')).resolution.kind, 'spell-note');
});
