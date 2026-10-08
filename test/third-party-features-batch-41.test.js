import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {readExploit, readChannelSmite} from '../scripts/plus-exploit-runtime.js';

// Third-party features batch 41 (2026-10-08): Wizards+'s exploits and Channel Smite+ (the user: "build exploits and Channel Smite … here too"; the slots and effects are live).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const item = name => structuredClone(items.find(entry => entry.name === name));

test('every exploit is read with its cost', () => {
    const read = name => readExploit(item(name));
    assert.deepEqual([read('Fickle Fate').kind, read('Fickle Fate').cost], ['fickle-fate', {anyTraits: ['fortune', 'misfortune']}]);
    assert.deepEqual([read('Adaptable Energy').cost, read('Adaptable Energy').burst], [{energy: true}, 30]);
    assert.deepEqual([read('Impromptu Incarnation').cost, read('Impromptu Incarnation').reach], [{anyTraits: ['summon']}, 10]);
    assert.deepEqual([read('Force Disruption').cost, read('Force Disruption').push, read('Force Disruption').emanation], [{forceOrAC: true}, {failure: 5, criticalFailure: 10}, 10]);
    assert.deepEqual([read('Immortality Clause').cost, read('Immortality Clause').deactivatedBy], [{rank: 10}, ['force', 'spirit']]);
    assert.deepEqual([read('Dimensional Jump').cost, read('Dimensional Jump').base, read('Dimensional Jump').perRank], [{}, 5, 5]);
    assert.deepEqual([read('Babbling Profusion').cost, read('Babbling Profusion').flatDC], [{anyTraits: ['linguistic']}, 11]);
});

test('Channel Smite+: Harm or Heal, spirit, basic Reflex for the area', () => {
    assert.deepEqual(readChannelSmite(item('Channel Smite+')), {kind: 'channel-smite', name: 'Channel Smite+', spells: ['harm', 'heal'], type: 'spirit', statistic: 'reflex'});
});
