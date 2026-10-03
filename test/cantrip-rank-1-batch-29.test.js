import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Echoing Weapon: a discharge scaled by the Strikes that hit', async () => {
    const plan = compileAbility(await spell('rank-1/echoing-weapon'));
    assert.equal(plan.resolution.kind, 'retaliation');
    const [trigger] = plan.resolution.retaliation.triggers;
    assert.deepEqual([trigger.damage.byCount.length, trigger.damage.type, trigger.damage.byCount[2]], [4, 'sonic', '(ceil(@item.rank/2)*3)']);
});

test('Echoing Weapon: kept strict', async () => {
    const source = await spell('rank-1/echoing-weapon');
    // A missing entry in the list, or another heightened rule, isn't read.
    assert.notEqual(compileAbility(withText(source, text => text.replace(', 4: @Damage[(ceil(@item.rank/2)*4)[sonic]]', ''))).resolution.kind, 'retaliation');
    assert.notEqual(compileAbility(withText(source, text => text.replace('The sonic damage increases by 1 per Strike (and the maximum damage increases by 4).', 'The weapon also deals 1d6 fire damage.'))).resolution.kind, 'retaliation');
});
