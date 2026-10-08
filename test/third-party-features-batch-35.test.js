import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 35 (2026-10-07): Triplicate Casting (the slots are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));

test('Triplicate Casting: three casts, one slot; dynamic mastery the table\'s', () => {
    assert.deepEqual(readActionCast(structuredClone(items.find(entry => entry.name === 'Triplicate Casting'))), {kind: 'triplicate', name: 'Triplicate Casting', count: 3, table: ['Only dynamic mastery spells.']});
});
