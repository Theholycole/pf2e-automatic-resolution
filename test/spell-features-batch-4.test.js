import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape, readItemRequirements} from '../src/compiler/item-spellshape.js';
import {unmetRequirement} from '../src/compiler/spellshape-readers.js';

// Spell features batch F4 (2026-10-05): items whose activation is a spellshape, read from PF2e's text (27 exported to the fixture).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/pf2e-spell-features/spellshape-items.json', import.meta.url)));
const read = name => readItemSpellshape(items.find(item => item.name === name));
const riders = (name, at = 0) => read(name).activations[at].riders;

test('every spellshape item is read', () => {
    assert.equal(items.length, 27);
    assert.deepEqual(items.filter(item => !readItemSpellshape(item)).map(item => item.name), []);
});

test("the items' spells: prepared, a trait, healing, a rank cap, a feat's effects", () => {
    assert.deepEqual(read('Radiant Tome').activations[0].requires, {prepared: true, anyTraits: ['light']});
    assert.equal(read("Dragon's Breath (4th Level Spell)").activations[0].requires.maxRank, 4);
    assert.deepEqual(riders("Dragon's Breath (4th Level Spell)")[0].feats.map(feat => feat.name), ['Widen Spell']);
    const codex = read('Codex of Destruction and Renewal').activations;
    assert.equal(codex.length, 2);
    assert.equal(codex[0].requires.damaging, true);
    assert.equal(codex[1].requires.healing, true);
    assert.equal(readItemRequirements('a lullaby spell with a rhyme'), null);
    assert.equal(unmetRequirement({prepared: true, anyTraits: ['light']}, {traits: ['light'], prepared: false, damageTypes: []}), "it isn't a prepared spell");
    assert.equal(unmetRequirement({healing: true}, {traits: [], healing: true, damageTypes: []}), null);
});

test('Codex: resistance 10 ignored and 1s rerolled; regeneration 20 for 4 rounds on the healed', () => {
    assert.deepEqual(riders('Codex of Destruction and Renewal').slice(0, 2), [{type: 'ignore-resistance', types: null, value: 10}, {type: 'reroll-ones'}]);
    const [regen] = riders('Codex of Destruction and Renewal', 1);
    assert.deepEqual([regen.type, regen.rounds, regen.rules[0]], ['healed-generated', 4, {key: 'FastHealing', type: 'regeneration', value: 20}]);
});

test('Radiant Tome and Bloodstained Treatise: areas whose creatures save as their turns begin', () => {
    const [light] = riders('Radiant Tome');
    assert.deepEqual([light.center, light.radius, light.rounds, light.who, light.statistic, light.immuneRounds], ['caster', 15, 10, 'enemies', 'fortitude', 10]);
    assert.deepEqual(light.outcomes.criticalFailure.map(entry => entry.slug), ['blinded', 'dazzled']);
    const [bleed, pool] = riders('Bloodstained Treatise');
    assert.deepEqual([bleed.when, bleed.formula, bleed.damageType, bleed.raisesOwn], ['all', '1d6', 'bleed', true]);
    assert.deepEqual([pool.center, pool.radius, pool.rounds, pool.who, pool.statistic, pool.outcomes.failure[0].slug], ['chosen-target', 5, 1, 'all', 'reflex', 'prone']);
});

test('Sparking Grimoire: Strike dice (allies too for the greater) and the retaliation; Shadow Signet; Hundred-Moth', () => {
    assert.equal(riders('Sparking Grimoire')[0].allies, false);
    assert.equal(riders('Sparking Grimoire (Greater)')[0].allies, true);
    assert.deepEqual(riders('Sparking Grimoire')[1], {type: 'retaliate', formula: '2d6', damageType: 'electricity', statistic: 'reflex', until: 'caster-next-turn-end'});
    assert.deepEqual(riders('Shadow Signet'), [{type: 'attack-defense', choice: ['fortitude', 'reflex']}]);
    const moth = read('Hundred-Moth Caress').activations[0];
    assert.deepEqual(moth.arm, {type: 'self-damage', formula: '1d10', damageType: 'void', ignoreIWR: true});
    assert.equal(moth.riders[0].formula, 'armed');
});

test('cards, the Lie, the poems, the constellation and the potion', () => {
    assert.equal(riders('Book of Endless Walls')[0].immuneHours, 24);
    assert.deepEqual(riders('Book of Endless Walls')[0].outcomes.criticalFailure.map(entry => entry.rounds), [1, 10]);
    assert.deepEqual(riders("Liar's Lexicon").map(rider => rider.type), ['trait', 'lie-check']);
    assert.deepEqual(riders("Juubun's One Thousand Poems").map(rider => rider.type), ['ally-temp-hp', 'conditions']);
    assert.equal(riders("Architect's Pattern Book").at(-1).uuid, 'Compendium.pf2e.equipment-effects.Item.IlNjAwsIZShlVsCT');
    assert.deepEqual(read('Star Chart Tattoo').activations[0].arm.uses, 3);
    assert.deepEqual(riders('Djezet Dose')[0].feats.map(feat => feat.name), ['Reach Spell', 'Widen Spell']);
});
