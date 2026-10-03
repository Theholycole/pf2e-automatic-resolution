import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Death\'s Call: temporary Hit Points from the triggering creature\'s level, doubled for undead', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('temp-hp'));
    const plan = compileAbility(await spell('rank-1/deaths-call'));
    assert.equal(plan.resolution.kind, 'temp-hp');
    assert.deepEqual([plan.resolution.tempHp.doubleIfUndead, plan.resolution.tempHp.duration], [true, {value: 1, unit: 'minutes'}]);
});

test('Death\'s Call: kept strict', async () => {
    const source = await spell('rank-1/deaths-call');
    assert.notEqual(compileAbility(withText(source, text => text.replace('plus your spellcasting attribute modifier', 'plus half your level'))).resolution.kind, 'temp-hp');
    assert.notEqual(compileAbility(withText(source, text => text.replace('depleted earlier.', 'depleted earlier. You also regain 1d4 Hit Points.'))).resolution.kind, 'temp-hp');
});
