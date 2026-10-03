import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {heightenedComponentFormula} from '../src/compiler/retaliation.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('retaliation: creatures that hit (or grab) the caster take the stated damage, no save', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('retaliation'));
    const nettle = compileAbility(await spell('rank-1/nettleskin')).resolution;
    assert.equal(nettle.kind, 'retaliation');
    assert.deepEqual([nettle.retaliation.triggers.length, nettle.retaliation.triggers[0].damage.formula, nettle.retaliation.shortenPerHit, nettle.retaliation.durationSeconds], [1, '1d4', true, 60]);
    const armor = compileAbility(await spell('rank-1/armor-of-thorn-and-claw')).resolution.retaliation;
    assert.deepEqual(armor.triggers.map(trigger => [trigger.damage.formula, trigger.damage.type, Boolean(trigger.damage.persistent)]), [['1', 'piercing', false], ['(ceil(@item.rank / 2))d4', 'bleed', true]]);
    const vibrant = compileAbility(await spell('rank-1/vibrant-thorns')).resolution.retaliation;
    assert.deepEqual(vibrant.triggers.map(trigger => trigger.damage.formula), ['(@item.rank)', '(@item.rank)d6']);
    // Heightened by PF2e's interval: Nettleskin +1d4 per rank, Armor of Thorn and Claw +2 per 2 ranks.
    assert.deepEqual([heightenedComponentFormula('1d4', '1d4', 2), heightenedComponentFormula('1', '2', 1), heightenedComponentFormula('1d4', null, 3)], ['3d4', '3', '1d4']);
});

test('retaliation: kept strict', async () => {
    const nettle = await spell('rank-1/nettleskin');
    // Damage the item's entry doesn't match, a save, or another rule after the trigger aren't read.
    assert.notEqual(compileAbility(withText(nettle, text => text.replace('take 1d4 piercing', 'take 1d6 piercing'))).resolution.kind, 'retaliation');
    assert.notEqual(compileAbility(withText(nettle, text => text.replace('break off.', 'break off. They are also Frightened 1.'))).resolution.kind, 'retaliation');
    const saved = structuredClone(nettle); saved.system.defense = {save: {basic: true, statistic: 'reflex'}};
    assert.notEqual(compileAbility(saved).resolution.kind, 'retaliation');
});
