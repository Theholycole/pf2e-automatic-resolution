import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {claims, itemClaims} from '../src/compiler/item-claims.js';

// api.claims (2026-10-15, for the item module): the items this module acts on, so the item module leaves them alone.
const load = path => JSON.parse(fs.readFileSync(new URL(`../.cache/${path}`, import.meta.url)));
const spellhearts = load('pf2e-spell-features/spellhearts.json');
const statItems = load('pf2e-spell-features/spell-stat-items.json');
const wands = fs.readdirSync(new URL('../.cache/pf2e-spellshape-fixtures/wands', import.meta.url)).map(file => load(`pf2e-spellshape-fixtures/wands/${file}`));
const catalysts = load('pf2e-spell-features/pf2e-catalysts.json').map(entry => ({name: entry.name, type: 'consumable', system: {traits: {value: entry.traits}, description: {value: entry.text}, rules: entry.rules}}));

test('spellhearts, wands and catalysts are claimed', () => {
    for (const set of [spellhearts, wands, catalysts]) assert.deepEqual(set.filter(item => !claims(item)).map(item => item.name), []);
});

test("the items whose casts this module reads (the item module's overlap)", () => {
    for (const name of ['Searing Blade', 'Sky Hammer', "Dragon's Eye Charm", 'Trident of the Azarketi']) {
        const item = [...spellhearts, ...statItems].find(entry => entry.name?.startsWith(name));
        assert.ok(item && itemClaims(item).includes('item-casts'), name);
    }
});

test('what this module leaves alone: a plain potion, a spellgun, a spell or a feat', () => {
    assert.equal(claims({type: 'consumable', name: 'Healing Potion', system: {traits: {value: ['consumable', 'healing', 'potion']}, description: {value: '<p>A healing potion restores Hit Points.</p>'}}}), false);
    assert.equal(claims(statItems.find(item => /Spellgun/.test(item.name))), false);
    assert.equal(claims({type: 'spell', name: 'Fireball', system: {traits: {value: ['fire']}, description: {value: ''}}}), false);
    assert.equal(claims({type: 'feat', name: 'Wand Feat', system: {traits: {value: ['wand']}, description: {value: ''}}}), false);
});
