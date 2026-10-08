import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {prepareSpellNoteEffectSource, validNoteRule} from '../scripts/note-effects.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('numbers in spell notes: a created thing\'s statistics and situational bonuses are the GM\'s; an unconditional bonus is a rule', async () => {
    // "The plant has AC 10, Hardness 5, and 20 Hit Points.": the statistics of what the spell creates.
    const sprout = compileAbility(await spell('rank-1/verdant-sprout'));
    assert.deepEqual([sprout.resolution.kind, sprout.resolution.note.recipient, sprout.resolution.note.rules], ['spell-note', 'source', undefined]);
    // (Since batch 158, stated check bonuses are their own family: the bonus-effect route.)
    const fashion = compileAbility(await spell('rank-1/fashionista'));
    assert.deepEqual([fashion.resolution.kind, fashion.resolution.bonusEffect.recipient], ['bonus-effect', 'target']);
    const groom = compileAbility(await spell('rank-1/groom-companion'));
    assert.deepEqual([groom.resolution.kind, groom.resolution.bonusEffect.bonuses[0].selector], ['bonus-effect', 'performance']);
});

test('numbers in spell notes: kept strict', async () => {
    // An unconditional clause beside a situational one isn't read as situational: since notes batch 1 (2026-10-05) both bonuses and the Command bonus
    // are a stated Effect.
    const glimmer = compileAbility(await spell('rank-4/movanic-glimmer'));
    assert.deepEqual(glimmer.resolution.statedEffect.rules.map(rule => [[rule.selector].flat().join(), rule.value]), [['perception,will', 2], ['nature', 1]]);
    assert.notEqual(compileAbility(withText(await spell('rank-4/movanic-glimmer'), text => text.replace('and any Nature checks to Command the target Animal gain', 'and it gains'))).resolution.kind, 'spell-note');
    // Temporary Hit Points, resistance and Speeds stay off the route.
    assert.notEqual(compileAbility(await spell('rank-1/deaths-call')).resolution.kind, 'spell-note');
    // A bonus to the caster when the note goes on the target isn't guessed.
    const groom = await spell('rank-1/groom-companion');
    assert.notEqual(compileAbility(withText(groom, text => text.replace('Your companion gains', 'You gain'))).resolution.kind, 'spell-note');
    // Only the generated rule shape is carried.
    assert.equal(validNoteRule({key: 'FlatModifier', selector: 'performance', type: 'status', value: 1}), true);
    for (const rule of [{key: 'FlatModifier', selector: 'damage', type: 'status', value: 1}, {key: 'FlatModifier', selector: 'ac', type: 'untyped', value: 1},
        {key: 'FlatModifier', selector: 'ac', type: 'status', value: 9}, {key: 'Resistance', type: 'fire', value: 5}]) assert.equal(validNoteRule(rule), false, JSON.stringify(rule));
    assert.throws(() => prepareSpellNoteEffectSource({duration: {mode: 'unlimited'}, rules: [{key: 'Resistance', type: 'fire', value: 5}]},
        {text: 'T.', castId: 'c', castRank: 1, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'S', targetActorUuid: 'T'}));
});
