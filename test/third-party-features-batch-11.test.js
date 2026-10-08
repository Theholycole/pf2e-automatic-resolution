import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readTextRules, rulesWithText, readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';
import {readSpellshapeFeat} from '../src/compiler/spellshape-readers.js';

// Third-party features batch 11 (2026-10-07): Comfort of Struggle's and Scholar's Lore's Effects from their text; the passive riders of Cloaked Casting, Extended
// Cloaking, Monstrous Familiar, Scholar's Lore; Slot-Charged Spell.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name && entry.type !== 'spell'));

test('the Effects from their text', () => {
    const comfort = item('Effect: Comfort of Struggle');
    const read = readTextRules(comfort);
    assert.equal(read.levelFrom, 'origin-cursebound');
    const rules = rulesWithText(comfort.system.rules, read).filter(rule => rule.key === 'FlatModifier');
    assert.deepEqual(rules.map(rule => [rule.value, rule.removeAfterRoll]), [['min(3,max(1,@item.level))', 'if-enabled'], ['-min(3,max(1,@item.level))', 'if-enabled']]);
    const scholar = item("Effect: Scholar's Lore");
    assert.deepEqual(rulesWithText(scholar.system.rules, readTextRules(scholar)), [{key: 'FlatModifier', selector: ['saving-throw', 'ac'], type: 'status', value: -1, predicate: ['origin:signature:{item|origin.signature}', 'item:type:spell']}]);
});

test('the passive riders', () => {
    assert.deepEqual(readPassiveCastRider(item('Cloaked Casting')).riders, [{type: 'offguard-save-penalty', value: 1, modifierType: 'circumstance'}]);
    assert.equal(readPassiveCastRider(item('Extended Cloaking')).riders[0].rounds, 'rank');
    const familiar = readPassiveCastRider(item('Monstrous Familiar'));
    assert.deepEqual([familiar.riders[0].to, familiar.riders[0].optional, familiar.riders[0].alsoEffect.name], ['familiar', true, 'Effect: Monstrous Familiar']);
    assert.deepEqual(readPassiveCastRider(item("Scholar's Lore")).riders, [{type: 'consume-target-effect', effectName: "Effect: Scholar's Lore"}]);
});

test('Slot-Charged Spell', () => {
    const read = readSpellshapeFeat(item('Slot-Charged Spell'));
    assert.deepEqual([read.requires, read.riders], [{belowHighest: 3}, [{type: 'slot-charge', divisor: 2, min: 1, cap: 'highest'}]]);
});
