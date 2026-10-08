import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readPassiveCastRider, readTextRules, rulesWithText} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 14 (2026-10-07): the table's cast-rider features; Embodiment (a power ring rune) and its Effect.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name && entry.type !== 'spell'));

test('the table\'s', () => {
    for (const name of ["Prophet's Staff", 'Magical Feedback', 'Spellshaping Synergy', 'Aquatic Spellcaster', 'Concealing Holograms', 'Ranged Resonance', 'Pantraditional Knowledge', 'Glyph-Triggered Spell', 'Consult Tome', 'Stance: Consult Tome', 'Arcane Vitalization', 'Warping', 'Warping (Greater)', 'Warping (Major)']) {
        const read = readPassiveCastRider(item(name));
        assert.equal(read?.tableOnly, true, name);
    }
});

test('Embodiment', () => {
    const read = readPassiveCastRider(item('Embodiment'));
    assert.deepEqual(read.riders, [{type: 'self-rules', label: 'status bonus to Strikes', forSpell: true, rules: [{key: 'FlatModifier', selector: 'strike-attack-roll', type: 'status', value: 'ringBonus'}]}]);
    const effect = item('Effect: Embodiment Ring Rune');
    assert.deepEqual(rulesWithText(effect.system.rules, readTextRules(effect)), [{key: 'FlatModifier', selector: 'strike-attack-roll', type: 'status', value: '@item.origin.flags.pf2e.ringofpower'}]);
});
