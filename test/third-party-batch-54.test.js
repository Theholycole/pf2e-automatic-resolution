import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {treeAt} from '../src/compiler/engulfing-tree.js';

// Third-party batch 54 (2026-10-07): Wooden Engulfment (Oracles+) — the tree a token (40 feet, 60 HP, AC 30, reach 15 feet at 6th; +5 feet, +10 HP, +3 AC a rank),
// Immobilized; the creatures in its square moved beside it; its grab the caster's spell attack against the Reflex DC: Grabbed, or Restrained on a critical success.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Wooden Engulfment: the tree and its grab', () => {
    const plan = compile(spell('Wooden Engulfment'));
    assert.equal(plan.resolution.kind, 'engulfing-tree');
    const data = plan.resolution.engulfingTree;
    assert.deepEqual([data.name, data.size, data.reach, data.defense, data.seconds], ['tree', 15, 15, 'reflex', 60]);
    assert.deepEqual([treeAt(data, 6), treeAt(data, 8)], [{height: 40, hp: 60, ac: 30}, {height: 50, hp: 80, ac: 36}]);
    assert.match(data.grabbed, /kWc1fhmv9LBiTuei$/);
    assert.match(data.restrained, /VcDeM8A5oI6VqhbM$/);
    assert.equal(data.notes.length, 3);
});
