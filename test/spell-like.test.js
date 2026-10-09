import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {spellFacts, spellLikeSource} from '../scripts/spellshape-runtime.js';
import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';

// A card that counts as a spell without being one (a kineticist's 2-action impulse: api.castingRules.onSpellLike, 2026-10-08): its description read as
// a spell's facts, which the spellshapes' requirements check as they do a spell's.
const blast = {name: 'Elemental Blast', slug: 'elemental-blast', traits: ['impulse', 'kineticist', 'primal', 'attack'], elements: ['fire'], rank: 3, level: 5, actions: 2,
    damageTypes: ['fire'], area: null, range: '30 feet', target: '1 creature', saveStatistic: null, attack: true, dc: 22, cantrip: false};

test("a spell-like card's facts: its traits and elements, damage, target, attack, actions; no slot, wand or cantrip", () => {
    const facts = spellFacts(spellLikeSource(blast));
    assert.deepEqual(facts.traits, ['impulse', 'kineticist', 'primal', 'attack', 'fire']);
    assert.deepEqual(facts.damageTypes, ['fire']);
    assert.equal(facts.singleTarget, true);
    assert.equal(facts.targeted, true);
    assert.equal(facts.attack, true);
    assert.equal(facts.actions, 2);
    assert.equal(facts.rank, 3);
    assert.equal(facts.range, '30 feet');
    assert.equal(facts.area, null);
    assert.equal(facts.fromSlots, false);
    assert.equal(facts.cantrip, false);
    const area = spellFacts(spellLikeSource({...blast, target: '', attack: false, saveStatistic: 'reflex', area: {type: 'burst', value: 10}}));
    assert.deepEqual(area.area, {type: 'burst', value: 10});
    assert.equal(area.saveStatistic, 'reflex');
    assert.equal(area.singleTarget, false);
});

test('a spellshape\'s requirements read the card as a spell (Reach Spell needs a range; Widen Spell an area)', async () => {
    const feat = async name => readSpellshapeFeat(JSON.parse(await readFile(new URL(`../.cache/pf2e-spellshape-fixtures/feats/${name}.json`, import.meta.url), 'utf8')));
    const reach = await feat('reach-spell');
    const widen = await feat('widen-spell');
    const facts = spellFacts(spellLikeSource(blast));
    assert.equal(unmetRequirement(reach.requires, facts), null);
    assert.notEqual(unmetRequirement(widen.requires, facts), null);
    assert.equal(unmetRequirement(widen.requires, spellFacts(spellLikeSource({...blast, target: '', area: {type: 'burst', value: 10}}))), null);
});
