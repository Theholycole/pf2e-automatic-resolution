import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));

test('Force Fang: damage with no check to a target within melee reach; the Spellstrike range is a reminder', async () => {
    const plan = compileAbility(await spell('rank-1/force-fang'));
    assert.equal(plan.resolution.kind, 'direct-damage');
    assert.equal(plan.resolution.damage.reach, 'melee');
    assert.match(plan.resolution.damage.notes[0], /Spellstrike with a ranged weapon/);
});
