import assert from 'node:assert/strict';
import test from 'node:test';

import {readCreatureSpellAbility} from '../scripts/creature-spell-abilities-runtime.js';
import {readActionShape} from '../scripts/spell-actions-runtime.js';

// Spell features batches G2 and G3 (2026-10-06): creature abilities on spells, read from the creatures' own texts; actions that change the next spell.
const ability = (html, rules = []) => readCreatureSpellAbility({system: {description: {value: html}, rules}});

test("a creature's aura counteract, in both of PF2e's wordings", () => {
    const aura = [{key: 'Aura', radius: 30}];
    assert.deepEqual(ability('<p>30 feet. When a creature in the aura uses a vitality spell or ability, the graveknight automatically attempts to counteract it, with a counteract modifier of [[/r 1d20+17 #Counteract]]{+17}.</p>', aura),
        {type: 'aura-counteract', trait: 'vitality', modifier: 17, radius: 30});
    assert.equal(ability('<p>30 feet. When a creature in the aura uses a vitality spell or ability, the graveknight automatically attempts to counteract it, with a +27 counteract modifier.</p>', aura).modifier, 27);
    // (The glossary's template — "+x" — isn't a number: unread.)
    assert.equal(ability('<p>30 feet. When a creature in the aura uses a vitality spell or ability, the graveknight automatically attempts to counteract it, with a counteract modifier of [[/r 1d20+0 #Counteract]]{+x}.</p>', aura), null);
});

test('reaction counteracts, the summon counteract, the healing aura, the compulsion and the item-spell immunity', () => {
    assert.deepEqual(ability('<p><strong>Trigger</strong> A spell or ability with the electricity trait is used within 30 feet of the shock zombie <strong>Effect</strong> The shock zombie attempts to counteract the spell or ability (counteract rank 3, counteract modifier [[/r 1d20+17 #Counteract]]{+17}), harmlessly redirecting the electricity into one of its electricity coils.</p>'),
        {type: 'reaction-counteract', trait: 'electricity', within: 30, rank: 3, modifier: 17});
    assert.equal(ability('<p><strong>Trigger</strong> A creature within 30 feet uses magic to summon or conjure a creature <strong>Effect</strong> The dragon attempts a counteract check with a Hell Lore check (counteract rank equal to half the dragon\'s level, rounded up). On a success, …</p>').lore, 'hell-lore');
    const maiden = ability("<p>30 feet. When a creature in the aura uses a spell or ability with the healing trait, it must succeed at a Will save against the path maiden's spell DC – 3. On a failure, the amount of Hit Points restored by the spell or ability is halved. On a critical failure, the vitality energy becomes void energy, harming a living target instead of healing it.</p>", [{key: 'Aura', radius: 30}]);
    assert.deepEqual([maiden.type, maiden.trait, maiden.statistic, maiden.less, maiden.radius], ['aura-halve-healing', 'healing', 'will', 3, 30]);
    assert.deepEqual(ability('<p>A creature who casts a spell within 30 feet of the mutant must succeed at a @Check[will|dc:24] save or spend its next action to Stride toward the mutant. It can\'t Delay …</p>'),
        {type: 'cast-compulsion', within: 30, statistic: 'will', dc: 24, compulsion: 'spend its next action to Stride toward the mutant'});
    assert.deepEqual(ability('<p>The jiang-shi is immune to spells cast from a magic item without expending a spell slot, such as from a scroll or wand.</p>', [{key: 'RollOption', option: 'warped-fulu', toggleable: true}]),
        {type: 'item-spell-immunity', toggle: 'warped-fulu'});
});

test("actions that change the next spell: Draw From the Pages, a lich's Metamagic Alteration", () => {
    const pages = readActionShape({name: 'Draw From the Pages', system: {description: {value: "<p>Spend a Mythic Point, and then Cast a Spell directly from your spellbook. The spell you cast must be one that takes one or two actions to cast, and it's automatically heightened to a rank equal to half your level. Use mythic proficiency to determine any attack rolls or spell DCs.</p>"}}});
    assert.deepEqual(pages.requires, {actions: [1, 2]});
    assert.deepEqual(pages.riders.map(rider => rider.type), ['rank-change', 'mythic-proficiency']);
    const lich = readActionShape({name: 'Metamagic Alteration', system: {description: {value: "<p>If the lich's next action is to Cast a Spell, they can alter it in one of two ways. Increase the range of that spell by 30 feet (giving it a range of 30 feet if it's a touch spell). Alternatively, the lich can change the area of the spell if the spell has an area and doesn't have a duration. If the spell is a burst with a radius of at least 10 feet, increase the radius by 5 feet. If it is a line or a cone that has an area of 15 feet or smaller, add 10 feet to the area.</p>"}}});
    assert.deepEqual(lich.riders[0].grow, [{types: ['burst'], min: 10, add: 5}, {types: ['cone', 'line'], max: 15, add: 10}]);
    assert.deepEqual(lich.requires, {area: true, noDuration: true});
});

test("River's Reflection: its linked Cast a Spell read; the vitality and void damage swapped", () => {
    const river = readActionShape({name: "River's Reflection", system: {description: {value: "<p>Existing between life and death … If the next action you use is to @UUID[Compendium.pf2e.actionspf2e.Item.aBQ8ajvEBByv45yz]{Cast a Spell} with the vitality or void traits, that spell's effects on living and undead targets are reversed. All void damage becomes vitality damage and vice versa. Any ability to heal living creatures or undead creatures is similarly swapped.</p>"}}});
    assert.deepEqual(river.requires, {anyTraits: ['vitality', 'void']});
    assert.deepEqual(river.riders[0], {type: 'damage-type-swap', pair: ['vitality', 'void']});
});
