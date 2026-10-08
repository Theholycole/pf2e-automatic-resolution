import assert from 'node:assert/strict';
import test from 'node:test';

import {gridDirection, stepsWithin, adjacentFreeSpace, nearestRegionPoint} from '../scripts/forced-movement.js';

// Forced movement (2026-10-05): the nearest of 8 directions, PF2e's 5/10 diagonals, and no two creatures ending in the same space — a creature that would
// end in another's space ends beside it instead (the user's rule).
const scene = tokens => { const parent = { tokens, dimensions: { sceneRect: { x: 0, y: 0, width: 2000, height: 2000 } } }; for (const token of tokens) token.parent = parent; return parent; };
const token = (id, x, y, size = 1) => ({ id, x, y, width: size, height: size, actor: { uuid: id }, hidden: false });

test("Directions and distances: the nearest of 8; diagonals 5 then 10 feet", () => {
    assert.deepEqual(gridDirection({ x: 0, y: 0 }, { x: 100, y: 10 }), [1, 0]);
    assert.deepEqual(gridDirection({ x: 0, y: 0 }, { x: 100, y: 90 }), [1, 1]);
    assert.deepEqual(gridDirection({ x: 0, y: 0 }, { x: -5, y: -100 }), [0, -1]);
    assert.equal(gridDirection({ x: 1, y: 1 }, { x: 1, y: 1 }), null);
    assert.deepEqual([stepsWithin(10, false), stepsWithin(10, true), stepsWithin(15, true), stepsWithin(30, true)], [2, 1, 2, 4]);
});

test("Ending in another creature's space: beside it instead, nearest the intended spot", () => {
    const mover = token("mover", 0, 500), blocker = token("blocker", 500, 500), other = token("other", 400, 500);
    scene([mover, blocker, other]);
    // (Its spot is the blocker's; beside the blocker, the square toward where it came from is taken, so the nearest free one beside it.)
    const spot = adjacentFreeSpace(mover, 500, 500, 100, { from: { x: 0, y: 500 } });
    assert.ok(spot && !(spot.x === 500 && spot.y === 500) && !(spot.x === 400 && spot.y === 500));
    assert.ok(Math.max(Math.abs(spot.x - 500), Math.abs(spot.y - 500)) === 100);
    // (A free spot is kept.)
    assert.deepEqual(adjacentFreeSpace(mover, 700, 700, 100), { x: 700, y: 700 });
    // (A large creature's space: beside its whole footprint.)
    const big = token("big", 1000, 1000, 2), small = token("small", 0, 0);
    scene([big, small]);
    const beside = adjacentFreeSpace(small, 1100, 1100, 100);
    assert.ok(beside.x < 1000 || beside.x >= 1200 || beside.y < 1000 || beside.y >= 1200);
});

test("A wall's nearest point: a line, a rectangle, a burst's centre", () => {
    assert.deepEqual(nearestRegionPoint({ shapes: [{ type: "line", x: 0, y: 0, length: 1000, rotation: 0 }] }, { x: 300, y: 250 }), { x: 300, y: 0 });
    assert.deepEqual(nearestRegionPoint({ shapes: [{ type: "rectangle", x: 0, y: 0, width: 200, height: 100 }] }, { x: 500, y: 50 }), { x: 200, y: 50 });
    assert.deepEqual(nearestRegionPoint({ shapes: [{ type: "circle", x: 40, y: 60, radius: 300 }] }, { x: 500, y: 50 }), { x: 40, y: 60 });
});
