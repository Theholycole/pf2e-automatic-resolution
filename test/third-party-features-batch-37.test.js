import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readCounteractFeature} from '../scripts/plus-counteract-runtime.js';

// Third-party features batch 37 (2026-10-07): the counteract features (the counteracts and cards are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const read = name => readCounteractFeature(structuredClone(items.find(entry => entry.name === name)));

test('Dismiss Paltry Magic, Oracle\'s Eyes, Snuff Out, Spell Pyrophore', () => {
    assert.deepEqual([read('Dismiss Paltry Magic').pick, read('Dismiss Paltry Magic').modifier, read('Dismiss Paltry Magic').rank], [['spell-effect'], 'spell-attack', 'highest']);
    assert.deepEqual(read("Oracle's Eyes").conditions, ['blinded', 'dazzled', 'fascinated', 'invisible']);
    assert.deepEqual([read('Snuff Out').bonus, read('Snuff Out').alternative], ['cursebound', {faces: 6, type: 'void', statistic: 'fortitude', immuneMinutes: 1}]);
    const major = read('Spell Pyrophore (Major)');
    assert.deepEqual([major.modifier, major.rank, major.burn], [27, 'half-item-level', {damage: '10d4[fire],10d4[spirit]', statistic: 'fortitude', dc: 38}]);
});
