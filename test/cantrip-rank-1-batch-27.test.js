import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Spirit Link: 2 Hit Points (+2 per rank) moved from the caster to the target', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('hp-transfer'));
    const plan = compileAbility(await spell('rank-1/spirit-link'));
    assert.equal(plan.resolution.kind, 'hp-transfer');
    const data = plan.resolution.hpTransfer;
    assert.deepEqual([data.amount, data.heightening, data.durationSeconds, data.endsAtZero, data.notes.length], [2, {interval: 1, increase: 2}, 600, true, 5]);
});

test('Spirit Link: kept strict', async () => {
    const source = await spell('rank-1/spirit-link');
    assert.notEqual(compileAbility(withText(source, text => text.replace('You lose as many Hit Points as the target regained.', ''))).resolution.kind, 'hp-transfer');
    assert.notEqual(compileAbility(withText(source, text => text.replace('ends automatically.', 'ends automatically. The target also gains a +1 status bonus to AC.'))).resolution.kind, 'hp-transfer');
    const other = structuredClone(source); other.system.target.value = '1 creature';
    assert.notEqual(compileAbility(other).resolution.kind, 'hp-transfer');
});
