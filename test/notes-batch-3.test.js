import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {pointInShapes, nearestFreeSpace} from '../scripts/forced-movement.js';
import {compileAbility} from '../src/compiler/index.js';

// Notes batch 3 (the notes audit, 2026-10-05): forced-movement notes the module now carries out — out of an area (Garden of Stone, Blade Barrier, Lifewood
// Cage), to an adjacent space (Frost Pillar), into a line (Tornadic Gale), and a push stopped short (Arcane Explosion's Prone, Planar Collision's damage).
const fixture = async path => JSON.parse(await readFile(new URL(`../.cache/pf2e-test-fixtures/spells/spells/${path}`, import.meta.url), 'utf8'));
const scene = tokens => { const parent = { tokens, dimensions: { sceneRect: { x: 0, y: 0, width: 2000, height: 2000 } } }; for (const token of tokens) token.parent = parent; return parent; };
const token = (id, x, y, size = 1) => ({ id, x, y, width: size, height: size, actor: { uuid: id }, hidden: false });

test('area shapes: circle, rectangle, polygon, cone, line', () => {
    assert.equal(pointInShapes({ x: 150, y: 150 }, [{ type: 'circle', x: 100, y: 100, radius: 100 }]), true);
    assert.equal(pointInShapes({ x: 250, y: 250 }, [{ type: 'circle', x: 100, y: 100, radius: 100 }]), false);
    assert.equal(pointInShapes({ x: 50, y: 50 }, [{ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }]), true);
    assert.equal(pointInShapes({ x: 50, y: 50 }, [{ type: 'polygon', points: [0, 0, 100, 0, 100, 100, 0, 100] }]), true);
    assert.equal(pointInShapes({ x: 300, y: 10 }, [{ type: 'cone', x: 0, y: 0, radius: 400, angle: 90, rotation: 0 }]), true);
    assert.equal(pointInShapes({ x: 10, y: 300 }, [{ type: 'cone', x: 0, y: 0, radius: 400, angle: 90, rotation: 0 }]), false);
    assert.equal(pointInShapes({ x: 500, y: 40 }, [{ type: 'line', x: 0, y: 0, length: 1000, width: 100, rotation: 0 }]), true);
    assert.equal(pointInShapes({ x: 500, y: 140 }, [{ type: 'line', x: 0, y: 0, length: 1000, width: 100, rotation: 0 }]), false);
});

test('the nearest unoccupied space: out of an area, into one, beside', () => {
    const mover = token('mover', 500, 500), other = token('other', 600, 500);
    scene([mover, other]);
    // (Out of a 1-square area: an adjacent square, not the other creature's.)
    const out = nearestFreeSpace(mover, { outside: [{ type: 'rectangle', x: 500, y: 500, width: 100, height: 100 }], size: 100 });
    assert.ok(out && Math.max(Math.abs(out.x - 500), Math.abs(out.y - 500)) === 100 && !(out.x === 600 && out.y === 500));
    // (Out of a 3x3 area: two squares away.)
    const far = nearestFreeSpace(mover, { outside: [{ type: 'rectangle', x: 400, y: 400, width: 300, height: 300 }], size: 100 });
    assert.ok(far && Math.max(Math.abs(far.x - 500), Math.abs(far.y - 500)) === 200);
    // (Into a line beside it.)
    const into = nearestFreeSpace(mover, { inside: [{ type: 'line', x: 0, y: 450, length: 2000, width: 100, rotation: 0 }], size: 100 });
    assert.deepEqual(into, { x: 500, y: 400 });
    // (Only adjacent.)
    const beside = nearestFreeSpace(mover, { adjacentOnly: true, size: 100 });
    assert.ok(beside && Math.max(Math.abs(beside.x - 500), Math.abs(beside.y - 500)) === 100);
});

test('the compiled flags: Garden of Stone, Blade Barrier, Frost Pillar, Tornadic Gale', async () => {
    assert.deepEqual(compileAbility(await fixture('rank-3/garden-of-stone.json')).resolution.areaExit, { who: 'all' });
    assert.deepEqual(compileAbility(await fixture('rank-6/blade-barrier.json')).resolution.areaExit, { who: 'success' });
    assert.deepEqual(compileAbility(await fixture('rank-6/frost-pillar.json')).resolution.areaExit, { who: 'success', adjacent: true });
    assert.deepEqual(compileAbility(await fixture('rank-5/tornadic-gale.json')).resolution.areaPullIn, { maxSize: 'med' });
});
