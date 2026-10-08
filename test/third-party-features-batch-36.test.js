import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readFocusFeature} from '../scripts/plus-focus-runtime.js';

// Third-party features batch 36 (2026-10-07): the focus-pool features (the pools and slots are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const read = name => readFocusFeature(structuredClone(items.find(entry => entry.name === name)));

test('Golden Core, I Am Omnipotent!, Bargain Soul, Revitalizing Bun', () => {
    assert.deepEqual(read('Golden Core'), {name: 'Golden Core', kind: 'refocus-more', points: 2, fullAt: 18});
    const omni = read('I Am Omnipotent!');
    assert.deepEqual([omni.kind, omni.stupefied, omni.trait, omni.immuneMinutes], ['free-focus', 1, 'wizard', 10]);
    assert.deepEqual([read('Bargain Soul').kind, read('Bargain Soul').effect.name, read('Bargain Soul').below], ['bargain', 'Effect: Bargain Soul', 1]);
    assert.deepEqual(read('Revitalizing Bun'), {name: 'Revitalizing Bun', kind: 'bun', hours: 1, immuneDays: 1});
});
