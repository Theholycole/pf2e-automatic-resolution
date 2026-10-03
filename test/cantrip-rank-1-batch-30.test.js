import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Life Link: healing at cast, then damage shared with the caster; heightened targets and amount', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('damage-share'));
    const plan = compileAbility(await spell('rank-1/life-link'));
    assert.equal(plan.resolution.kind, 'damage-share');
    assert.deepEqual(plan.resolution.damageShare.ranks.map(entry => [entry.rank, entry.targets, entry.amount]), [[0, 1, 3], [3, 2, 5], [6, 3, 10], [9, 4, 15]]);
    assert.equal(plan.resolution.damageShare.endsUnconscious, true);
});

test('Life Link: kept strict', async () => {
    const source = await spell('rank-1/life-link');
    assert.notEqual(compileAbility(withText(source, text => text.replace('You lose 3 Hit Points each time', 'You lose 4 Hit Points each time'))).resolution.kind, 'damage-share');
    assert.notEqual(compileAbility(withText(source, text => text.replace('You can target 2 creatures other than you.', 'You can target 2 creatures.'))).resolution.kind, 'damage-share');
});
