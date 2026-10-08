import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readItemSpellshape} from '../src/compiler/item-spellshape.js';

// Third-party features batch 7 (2026-10-07): the "+" items' spellshape activations, read as feats — the Power Rings' Veracious Spell, the scepters (Sicken Spell,
// Energy Ablation, Heighten Spell, Reach Spell, Dangerous Odds, Purifying Spell).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => readItemSpellshape(structuredClone(items.find(entry => entry.name === name && entry.type !== 'spell')));

test('the Power Rings and the scepters', () => {
    // (Each ring's own text: Iron +1, Silver and Platinum +2.)
    for (const [name, value] of [['Power Ring (Iron)', 1], ['Power Ring (Silver)', 2], ['Power Ring (Platinum)', 2]]) {
        const ring = item(name);
        assert.deepEqual(ring.activations.map(activation => activation.label), ['Veracious Spell'], name);
        assert.deepEqual(ring.activations[0].riders[0].rules, [{key: 'FlatModifier', selector: 'spell-attack', type: 'item', value}], name);
    }
    const sicken = item('Scepter of Sickening');
    assert.deepEqual(sicken.activations.map(activation => activation.label), ['Sicken Spell']);
    assert.deepEqual(sicken.activations[0].riders[0].degrees.criticalFailure, [{uuid: 'Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18', slug: 'sickened', value: 2}]);
    assert.equal(sicken.activations[0].frequency, 'once per hour');
    const ablation = item('Scepter of Energy Ablation').activations[0];
    assert.deepEqual([ablation.riders[0].type, ablation.riders[0].until, ablation.riders[0].spellTypesOnly], ['self-resistance', 'caster-next-turn-end', true]);
    assert.deepEqual(item('Scepter of Heightening').activations[0].riders[0], {type: 'rank-change', by: 2});
    assert.deepEqual(item('Scepter of Heightening').activations[0].requires, {belowHighest: 3});
    assert.deepEqual(item('Scepter of Greater Distances').activations[0].riders[0], {type: 'range', add: 30, withFeat: {name: 'Reach Spell', add: 45}});
    assert.deepEqual(item('Scepter of Second Chances').activations[0].requires, {singleTarget: true, saves: ['will']});
    assert.equal(item('Scepter of Purifying').activations[0].riders[0].type, 'note');
});
