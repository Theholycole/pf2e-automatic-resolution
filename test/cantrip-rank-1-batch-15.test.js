import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';
import {prepareConditionGrantSource} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('condition grants: PF2e\'s condition on the recipient for the stated duration, plus a note', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('condition-note'));
    const allegro = compileAbility(await spell('cantrip/allegro'));
    assert.equal(allegro.resolution.kind, 'condition-note');
    const a = allegro.resolution.conditionNote;
    assert.deepEqual([a.recipient, a.condition.slug, a.condition.value, a.duration.value, a.duration.unit], ['target', 'quickened', null, 1, 'rounds']);
    assert.match(a.text, /Strike, Stride, or Step/);
    // "You Step and become Concealed." for the spell's "until the end of your next turn".
    const shift = compileAbility(await spell('rank-1/sudden-shift')).resolution.conditionNote;
    assert.deepEqual([shift.recipient, shift.condition.slug, shift.duration.expiry, shift.duration.anchor], ['source', 'concealed', 'turn-end', 'source-turn']);
    // "… during this movement and until the start of your next turn.": the sentence's own duration.
    const rush = compileAbility(await spell('rank-1/qi-rush')).resolution.conditionNote;
    assert.deepEqual([rush.recipient, rush.condition.slug, rush.duration.expiry, rush.duration.anchor], ['source', 'concealed', 'turn-start', 'source-turn']);
    // The grant Effect: PF2e's condition by GrantItem, deleted with the Effect.
    const source = prepareConditionGrantSource(a.condition, {uuid: a.condition.uuid, img: 'x.svg', system: {value: {isValued: false}}},
        {castId: 'c', castRank: 1, duration: a.duration, sourceActorUuid: 'Actor.a', sourceItemUuid: 'Item.i', sourceItemName: 'Allegro', targetActorUuid: 'Actor.t'});
    assert.deepEqual([source.name, source.system.rules[0].key, source.system.rules[0].uuid, source.system.duration.value], ['Allegro: Quickened', 'GrantItem', a.condition.uuid, 1]);
});

test('condition mentions: a spell that only mentions a condition can be a spell note', async () => {
    // (Liberating Command is automated since batch 162: the target's Escape.)
    assert.equal(compileAbility(await spell('rank-1/invisible-item')).resolution.kind, 'spell-note');
    assert.equal(compileAbility(await spell('rank-1/liberating-command')).resolution.kind, 'prompt-escape');
});

test('conditions: kept strict', async () => {
    // Restoring or reducing a condition is a mechanic, not a mention.
    assert.notEqual(compileAbility(await spell('rank-6/stone-to-flesh')).resolution.kind, 'spell-note');
    assert.notEqual(compileAbility(await spell('rank-1/veil-of-confidence')).resolution.kind, 'spell-note');
    // A grant to a creature the Target line doesn't name, or another grant wording, isn't read.
    const allegro = await spell('cantrip/allegro');
    const other = structuredClone(allegro); other.system.target.value = '1 creature that could hear you';
    assert.notEqual(compileAbility(other).resolution.kind, 'condition-note');
    assert.notEqual(compileAbility(withText(allegro, text => text.replace('The ally becomes', 'The ally might become'))).resolution.kind, 'condition-note');
    // A grant Effect whose value doesn't match PF2e's condition is refused.
    assert.throws(() => prepareConditionGrantSource({name: 'Frightened', slug: 'frightened', value: null}, {uuid: 'u', system: {value: {isValued: true}}},
        {castId: 'c', castRank: 1, duration: {mode: 'fixed', value: 1, unit: 'rounds'}, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'S', targetActorUuid: 'T'}));
});
