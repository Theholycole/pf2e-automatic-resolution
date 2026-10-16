import assert from 'node:assert/strict';
import test from 'node:test';

import {readSpellshapeFeat, unmetRequirement} from '../src/compiler/spellshape-readers.js';
import {disbeliefPainRule} from '../scripts/disbelief-pain.js';
import {readActionCast} from '../src/compiler/plus-feature-rules.js';

// PF2e 8.6's new spell features (Lost Omens Cheliax, Infernal Inheritance; 2026-10-16): Painful Spell (extra nonlethal mental damage per rank, the caster
// taking the same), Invoke Infernal Potency (an innate Fear or Spiritual Armament heightened, the caster's doomed raised) and And Yet it Still Hurts (a
// disbelief attempt's nonlethal damage). PF2e 8.6.1's text.
const feat = (name, traits, text) => ({name, type: 'feat', system: {slug: null, traits: {value: traits}, description: {value: text}}});
const painful = feat('Painful Spell', ['archetype', 'illusion', 'mental', 'spellshape'], "<p>Your spells carry agonizing shadowy barbs. If your next action is to Cast a Spell that deals damage, has no duration, and isn't a cantrip, it deals an additional 1d4 nonlethal mental damage per spell rank. You take nonlethal mental damage equal to the additional mental damage, which can't be reduced or prevented in any way.</p>");
const potency = feat('Invoke Infernal Potency', ['concentrate', 'spellshape'], '<p><strong>Requirements</strong> You are doomed</p><hr /><p><strong>Effect</strong> If your next action is to cast either fear or spiritual armament as an innate spell, you can heighten the spell to a rank 1 lower than half your level rounded up. You then increase the value of your doomed condition by 1.</p>');
const facts = extra => ({name: 'Fireball', cantrip: false, damageTypes: ['fire'], hasDuration: false, traits: [], innate: false, ...extra});

test('Painful Spell: a damaging non-cantrip without a duration; 1d4 nonlethal mental per rank, the caster the same amount past its resistances', () => {
    const shape = readSpellshapeFeat(painful);
    assert.deepEqual(shape.requires, {damaging: true, noDuration: true, nonCantrip: true});
    assert.deepEqual(shape.riders, [{type: 'extra-damage', formula: '1*rank-d4', damageType: 'mental', scaled: true, nonlethal: true, selfEqual: {nonlethal: true, unpreventable: true}}]);
    assert.equal(unmetRequirement(shape.requires, facts()), null);
    assert.equal(unmetRequirement(shape.requires, facts({cantrip: true})), 'a cantrip');
    assert.notEqual(unmetRequirement(shape.requires, facts({hasDuration: true})), null);
    // Kept strict: the caster's damage only as the extra damage's own type.
    assert.equal(readSpellshapeFeat(feat('Painful Spell', painful.system.traits.value, painful.system.description.value.replace('take nonlethal mental damage equal to the additional mental', 'take nonlethal fire damage equal to the additional fire'))), null);
});

test('Invoke Infernal Potency: Fear or Spiritual Armament cast as an innate spell, heightened to half the level less 1; doomed raised by 1', () => {
    const shape = readSpellshapeFeat(potency);
    assert.deepEqual(shape.requires, {spells: ['Fear', 'Spiritual Armament'], innate: true});
    assert.deepEqual(shape.riders, [{type: 'rank-change', to: 'half-level', offset: -1}, {type: 'self-increase', slug: 'doomed', by: 1}]);
    assert.equal(unmetRequirement(shape.requires, facts({name: 'Fear', innate: true})), null);
    assert.equal(unmetRequirement(shape.requires, facts({name: 'Fear', innate: false})), "it isn't cast as an innate spell");
    assert.notEqual(unmetRequirement(shape.requires, facts({name: 'Fireball', innate: true})), null);
});

test('And Yet it Still Hurts: read from the caster\'s feat text — twice the rank, nonlethal mental; nothing for another feat', () => {
    const hurts = {name: 'And Yet it Still Hurts', system: {description: {value: "<p>Cruel barbs cover your illusions, and even observing them is painful. Whenever a creature attempts to disbelieve one of your illusion spells, it takes nonlethal mental damage equal to twice the spell's rank regardless of the outcome.</p>"}}};
    assert.deepEqual(disbeliefPainRule({itemTypes: {feat: [hurts]}}), {damageType: 'mental', multiple: 2, feat: 'And Yet it Still Hurts'});
    assert.equal(disbeliefPainRule({itemTypes: {feat: [{name: 'And Yet it Still Hurts', system: {description: {value: '<p>Cruel barbs cover your illusions.</p>'}}}]}}), null);
    assert.equal(disbeliefPainRule(null), null);
});

test('Ferocious Gust: Gust of Wind\'s save card at the higher of the class DC and spell DC; kept strict', () => {
    const text = '<p><strong>Frequency</strong> once per 10 minutes</p><hr /><p>With heavy wing beats, you whip up a furious gust and direct it at your opponents. This air blast has the effects of @UUID[Compendium.pf2e.spells-srd.Item.g8QqHpv2CWDwmIm1]{Gust of Wind} with a @Check[fortitude|against:class-spell|traits:air]{fortitude DC} equal to your class DC or spell DC, whichever is higher.</p>';
    assert.deepEqual(readActionCast({name: 'Ferocious Gust', system: {description: {value: text}}}),
        {kind: 'spell-effects', name: 'Ferocious Gust', spell: {uuid: 'Compendium.pf2e.spells-srd.Item.g8QqHpv2CWDwmIm1', name: 'Gust of Wind'}, statistic: 'fortitude', dc: 'class-or-spell'});
    // (A rule before it — a bonus, a save — isn't narration: not read.)
    assert.equal(readActionCast({name: 'X', system: {description: {value: text.replace('you whip up a furious gust', 'you gain a +2 bonus')}}}), null);
});
