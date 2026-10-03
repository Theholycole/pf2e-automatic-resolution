import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {SUPPORTED_RESOLUTION_KINDS} from '../scripts/runtime-core.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Fated Healing: each target heals at the end of its own turns', async () => {
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('turn-healing'));
    const plan = compileAbility(await spell('rank-1/fated-healing'));
    assert.equal(plan.resolution.kind, 'turn-healing');
    const data = plan.resolution.turnHealing;
    assert.deepEqual([data.targets, data.formula, data.durationSeconds, Boolean(data.endsForHostile), data.heightening.interval], [2, '1d4', 30, true, 1]);
});

test('Fated Healing: kept strict', async () => {
    const source = await spell('rank-1/fated-healing');
    assert.notEqual(compileAbility(withText(source, text => text.replace('regain 1d4 Hit Points', 'regain 1d6 Hit Points'))).resolution.kind, 'turn-healing');
    assert.notEqual(compileAbility(withText(source, text => text.replace('hostile action.', 'hostile action. It also becomes Frightened 1.'))).resolution.kind, 'turn-healing');
});
