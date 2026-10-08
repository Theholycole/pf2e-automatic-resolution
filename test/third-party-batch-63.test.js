import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';

// Third-party batch 63 (2026-10-07): Mystic Bomb (Magus+) — 4d6 of the Arcane Cascade's type (basic Reflex) on the creatures in the burst, or the bomb waits: it explodes
// after a Sustain's move, grows by 5 feet to 20, and takes Aid (+1d6, +2d6 on a critical success counting twice; 3 uses, one more a rank).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Mystic Bomb: the bomb, its growth and its Aid', () => {
    const plan = compile(spell('Mystic Bomb'));
    assert.equal(plan.resolution.kind, 'mystic-bomb');
    const data = plan.resolution.mysticBomb;
    assert.deepEqual([data.dice, data.die, data.statistic, data.radius, data.grow, data.baseRank, data.seconds], [4, 6, 'reflex', 5, {feet: 5, max: 20}, 6, 24]);
    assert.deepEqual([data.aid.range, data.aid.critical, data.aid.uses, data.aid.critCounts, data.step], [60, 2, 3, 2, {dice: 1, uses: 1}]);
    assert.ok(!data.notes[0].includes('@UUID'));
});
