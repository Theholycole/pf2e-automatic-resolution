import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readActionCast, readPassiveCastRider} from '../src/compiler/plus-feature-rules.js';

// Third-party features batch 25 (2026-10-07): the cascades entered after a cast — Reservoir of Power, Puppet String, Havok Cascade's damage. (The stance's damage type from the last
// spell is the runtime's: scripts/text-rules.js cascadeTypeAhead, tested live.)
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = (name, type) => structuredClone(items.find(entry => entry.name === name && (!type || entry.type === type)));

test('Reservoir of Power and Puppet String: cast by their cards', () => {
    assert.equal(readActionCast(item('Reservoir of Power', 'feat')).kind, 'reservoir-of-power');
    const puppet = readActionCast(item('Arcane Cascade: Puppet String'));
    assert.deepEqual([puppet.range, puppet.traits, puppet.weakness, puppet.tether.name], [30, ['illusion', 'mental'], [1, 2, 3], 'Effect: Tethered (Puppet String)']);
    assert.match(puppet.self.uuid, /^Compendium\.magus\.magus-effects\.Item\./);
});

test('Havok Cascade: damage equal to the level on a havok spell, failing if avoided', () => {
    const read = readPassiveCastRider(item('Stance: Havok Cascade'));
    assert.deepEqual(read.riders, [{type: 'self-damage', formula: 'level', ifTraits: ['havok'], failsIfAvoided: true}]);
});
