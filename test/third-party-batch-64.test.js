import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {boundaryAt} from '../src/compiler/spirit-boundary.js';

// Third-party batch 64 (2026-10-07): Spirit Boundary (Magic+) — the shield by the actions spent (10 feet, (1 + rank) × 4 HP, reducing by 1 + rank; 20 feet, 2 + rank × 12,
// (1 + rank) × 2; any radius from 5 to 30 feet), the inline rolls checked against the Heightened entry; damage crossing its edge reduced, the shield taking it once per effect.
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Spirit Boundary: the three versions', () => {
    const plan = compile(spell('Spirit Boundary'));
    assert.equal(plan.resolution.kind, 'spirit-boundary');
    const {versions, seconds} = plan.resolution.spiritBoundary;
    assert.equal(seconds, 60);
    assert.deepEqual([1, 2, 3].map(actions => [versions[actions].radius, boundaryAt(versions[actions].hp, 4), boundaryAt(versions[actions].reduce, 4)]), [[10, 20, 5], [20, 50, 10], [null, 50, 10]]);
    assert.deepEqual([versions[3].min, versions[3].max], [5, 30]);
    assert.match(versions[3].dismiss, /Dismiss this spell as a reaction/);
});
