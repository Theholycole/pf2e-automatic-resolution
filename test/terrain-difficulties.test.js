import assert from 'node:assert/strict';
import test from 'node:test';

import {terrainDifficulties} from '../scripts/runtime-utils.js';

test('ground terrain also costs PF2e travel movement (out of combat)', () => {
    assert.deepEqual(terrainDifficulties(['walk'], 2), {walk: 2, travel: 2});
    assert.deepEqual(terrainDifficulties(['walk', 'fly'], 3), {walk: 3, fly: 3, travel: 3});
});

test('fly-only terrain stays fly-only', () => {
    assert.deepEqual(terrainDifficulties(['fly'], 2), {fly: 2});
});

test('the movement list is not changed', () => {
    const movement = ['walk'];
    terrainDifficulties(movement, 2);
    assert.deepEqual(movement, ['walk']);
});
