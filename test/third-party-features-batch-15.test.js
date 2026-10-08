import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readFocusRegain} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 15 (2026-10-07): the features that regain a Focus Point as they're used.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const read = name => readFocusRegain(structuredClone(items.find(entry => entry.name === name)));

test('Focus Points regained', () => {
    for (const name of ['Surging Focus+', 'Faith Will Vindicate Me!', 'Invigorative Breath', 'Wield the Divine', 'Linked Sparks', 'Linked to Undeath', 'Linked Pilfering', 'Linked Jabs', 'Linked Beguiling'])
        assert.equal(read(name)?.amount, 1, name);
    assert.deepEqual(read('Emergency Infusion').bleed, {formula: 'ceil(@level/2)', damageType: 'bleed'});
    assert.deepEqual(read('Monastic Practices').check, {skill: 'religion', dc: 'level'});
    assert.equal(read('Surging Focus+').frequency, 'PT1H');
    assert.equal(read('Qi-Siphoning Blow'), null, 'a point only for Energize');
    assert.equal(read('Flirting With Danger'), null);
});
