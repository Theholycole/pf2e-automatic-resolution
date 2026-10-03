import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {foodPieces, foodSeconds} from '../src/compiler/food-healing.js';
import {foodCardHTML} from '../scripts/effect-runtime.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const spell = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}.json`, import.meta.url), 'utf8'));
const withText = (item, html) => { const copy = structuredClone(item); copy.system.description.value = html; return copy; };

test('Cornucopia: one piece per rank, eaten any number at once, withering with the spell', async () => {
    const plan = compileAbility(await spell('rank-1/cornucopia'));
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes(plan.resolution.kind));
    assert.equal(plan.automation.level, 'automatic');
    const {healing} = plan.resolution;
    assert.equal(healing.recipient, 'consumer');
    assert.equal(healing.formula, '1d6+4');
    assert.deepEqual(healing.food.expires, {value: 10, unit: 'minute'});
    assert.equal(healing.food.anyAmount, true);
    assert.deepEqual([1, 3, 6].map(rank => foodPieces(healing.food, rank, plan.rank)), [1, 3, 6]);
    assert.equal(foodSeconds(healing.food), 600);
    assert.equal(plan.compilerEvidence.foodHealing.convenienceRolls, 1);
    assert.match(healing.food.notes[0].text, /square meal/);
});

test("Nature's Bounty: one piece, nourishing, gone after 1 minute", async () => {
    const plan = compileAbility(await spell('rank-4/natures-bounty'));
    const {healing} = plan.resolution;
    assert.equal(healing.recipient, 'consumer');
    assert.equal(healing.formula, '3d10+12');
    assert.deepEqual(healing.food.expires, {value: 1, unit: 'minute'});
    assert.equal(healing.food.anyAmount, false);
    assert.equal(foodPieces(healing.food, 7, plan.rank), 1);
    assert.equal(healing.food.notes[0].kind, 'nourishment');
});

test('food healing refuses text it does not account for', async () => {
    const bounty = await spell('rank-4/natures-bounty');
    const base = bounty.system.description.value;
    // Another rule after the food.
    const extra = compileAbility(withText(bounty, base.replace('after 1 minute.</p>', 'after 1 minute. The creature also gains a +1 status bonus to saves.</p>')));
    assert.notEqual(extra.resolution.healing?.recipient, 'consumer');
    // The text's healing isn't the item's.
    const wrong = structuredClone(bounty); wrong.system.damage['0'].formula = '2d10+12';
    assert.notEqual(compileAbility(wrong).resolution.healing?.recipient, 'consumer');
    // No time for the food to wither.
    const forever = compileAbility(withText(bounty, base.replace(' If uneaten, the food crumbles to dust after 1 minute.', '')));
    assert.notEqual(forever.resolution.healing?.recipient, 'consumer');
    // An unknown heightened entry.
    const cornucopia = await spell('rank-1/cornucopia');
    const heightened = compileAbility(withText(cornucopia, cornucopia.system.description.value.replace('produces an additional piece of food.', 'produces an additional piece of food. The food also cures one disease.')));
    assert.notEqual(heightened.resolution.healing?.recipient, 'consumer');
});

test('the food card shows what is left and who has eaten', () => {
    const html = foodCardHTML({spellName: 'Cornucopia', pieces: 3, remaining: 1, anyAmount: true, expires: {value: 10, unit: 'minute'},
        eaten: [{name: 'Ezren', pieces: 2, total: 17, healing: 17}]});
    assert.match(html, /1 of 3 pieces of food left/);
    assert.match(html, /Ezren: 2 pieces, healed 17/);
    assert.match(html, /pf2e-auto-food-button/);
    assert.doesNotMatch(foodCardHTML({spellName: 'Cornucopia', pieces: 1, remaining: 0, anyAmount: false, expires: {value: 10, unit: 'minute'}, eaten: []}), /pf2e-auto-food-button/);
});
