// Forced movement (pushes and pulls the module carries out): square by square in the nearest of the 8 directions away from or toward a point, stopping
// at walls and the scene's edge; diagonals count 5 then 10 feet, as PF2e's do. No two creatures end in the same space: a creature that would end in
// another's space ends instead in the free space adjacent to that creature nearest where it was going (the user's rule, 2026-10-05).
const MODULE_ID = "pf2e-automatic-resolution";

const DIRECTIONS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** The nearest of the 8 grid directions from one point to another (null when they coincide). */
export function gridDirection(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return null;
    const index = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    return DIRECTIONS[index];
}

/** The squares of a move: up to the feet given, diagonals 5/10 (PF2e). */
export function stepsWithin(feet, diagonal, gridFeet = 5) {
    if (!diagonal) return Math.floor(feet / gridFeet);
    let used = 0, steps = 0;
    while (true) {
        const cost = steps % 2 === 0 ? gridFeet : 2 * gridFeet;
        if (used + cost > feet) return steps;
        used += cost;
        steps += 1;
    }
}

/** A token's footprint at a position, in pixels. */
const box = (token, x, y, size) => ({ x, y, w: Number(token.width ?? 1) * size, h: Number(token.height ?? 1) * size });
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const centre = (token, x, y, size) => ({ x: x + Number(token.width ?? 1) * size / 2, y: y + Number(token.height ?? 1) * size / 2 });

/** The other creatures (with an actor, not hidden) whose space a footprint overlaps. */
function blockersAt(token, x, y, size) {
    const here = box(token, x, y, size);
    return (token.parent?.tokens ?? []).filter(other => other.id !== token.id && other.actor && !other.hidden && overlaps(here, box(other, other.x, other.y, size)));
}

function insideScene(token, x, y, size) {
    const rect = token.parent?.dimensions?.sceneRect ?? globalThis.canvas?.dimensions?.sceneRect;
    if (!rect) return true;
    const b = box(token, x, y, size);
    return b.x >= rect.x && b.y >= rect.y && b.x + b.w <= rect.x + rect.width && b.y + b.h <= rect.y + rect.height;
}

/** Whether a wall stops movement between two points (Foundry's move collision; none when it can't be tested). */
function wallBetween(a, b) {
    try {
        const backend = globalThis.CONFIG?.Canvas?.polygonBackends?.move;
        if (backend?.testCollision) return !!backend.testCollision(a, b, { type: "move", mode: "any" });
    } catch (_) {}
    return false;
}

/**
 * A creature that would end in another's space ends in the free space adjacent to that creature nearest the intended spot (then nearest where it came
 * from); free means no other creature's space, inside the scene, and no wall from the blocked spot. Returns {x, y} or null.
 */
export function adjacentFreeSpace(token, x, y, size = globalThis.canvas?.grid?.size ?? 100, { from = null } = {}) {
    const blockers = blockersAt(token, x, y, size);
    if (!blockers.length) return { x, y };
    const intended = centre(token, x, y, size);
    const origin = from ? centre(token, from.x, from.y, size) : intended;
    const candidates = [];
    for (const blocker of blockers) {
        const b = box(blocker, blocker.x, blocker.y, size);
        const w = Number(token.width ?? 1) * size, h = Number(token.height ?? 1) * size;
        // (Every position whose footprint touches the blocker's edge or corner without overlapping it.)
        for (let cx = b.x - w; cx <= b.x + b.w; cx += size) for (let cy = b.y - h; cy <= b.y + b.h; cy += size) {
            const spot = { x: cx, y: cy, w, h };
            if (overlaps(spot, b)) continue;
            if (!insideScene(token, cx, cy, size) || blockersAt(token, cx, cy, size).length) continue;
            const c = centre(token, cx, cy, size);
            if (wallBetween(intended, c) && wallBetween(origin, c)) continue;
            candidates.push({ x: cx, y: cy, near: Math.hypot(c.x - intended.x, c.y - intended.y), back: Math.hypot(c.x - origin.x, c.y - origin.y) });
        }
    }
    candidates.sort((a, b) => a.near - b.near || a.back - b.back);
    return candidates[0] ? { x: candidates[0].x, y: candidates[0].y } : null;
}

/**
 * Move a token by force: `away` from or `toward` a point, up to `feet`, in the nearest of the 8 directions; a pull toward a point stops before it reaches
 * the point's own creature (`stopAt` token). Walls and the scene's edge stop it; it never ends in another creature's space. Returns {moved, from, to, squares,
 * stoppedBy, feetLeft} (feetLeft: the feet a wall or the scene's edge kept it from moving).
 */
export async function forcedMove(tokenDoc, { point, direction = "away", feet, stopAt = null, reason = "" }) {
    const token = tokenDoc?.document ?? tokenDoc;
    if (!token?.parent || !point || !(Number(feet) > 0)) return { moved: false, reason: "nothing to move" };
    const size = token.parent.grid?.size ?? canvas.grid.size;
    const gridFeet = token.parent.grid?.distance ?? canvas.dimensions?.distance ?? 5;
    const start = { x: token.x, y: token.y };
    const here = centre(token, start.x, start.y, size);
    const away = gridDirection(point, here);
    const step = direction === "away" ? away : away && [-away[0], -away[1]];
    if (!step) return { moved: false, from: start, to: start, squares: 0, stoppedBy: "no direction" };
    const squares = stepsWithin(Number(feet), step[0] !== 0 && step[1] !== 0, gridFeet);
    let at = { ...start }, stoppedBy = null, taken = 0, feetMoved = 0;
    const stopBox = stopAt ? (() => { const t = stopAt.document ?? stopAt; return box(t, t.x, t.y, size); })() : null;
    for (let i = 0; i < squares; i++) {
        const next = { x: at.x + step[0] * size, y: at.y + step[1] * size };
        if (!insideScene(token, next.x, next.y, size)) { stoppedBy = "edge"; break; }
        if (stopBox && overlaps(box(token, next.x, next.y, size), stopBox)) { stoppedBy = "creature"; break; }
        if (wallBetween(centre(token, at.x, at.y, size), centre(token, next.x, next.y, size))) { stoppedBy = "wall"; break; }
        at = next;
        feetMoved += step[0] !== 0 && step[1] !== 0 && taken % 2 === 1 ? 2 * gridFeet : gridFeet;
        taken += 1;
    }
    // (Not on top of another creature: beside it.)
    const settled = adjacentFreeSpace(token, at.x, at.y, size, { from: start }) ?? start;
    if (settled.x !== at.x || settled.y !== at.y) stoppedBy = stoppedBy ?? "occupied";
    // (The feet it couldn't move, when a wall or the scene's edge stopped it: Planar Collision's damage, Arcane Explosion's Prone.)
    const feetLeft = stoppedBy === "wall" || stoppedBy === "edge" ? Math.max(0, Number(feet) - feetMoved) : 0;
    if (settled.x === start.x && settled.y === start.y) return { moved: false, from: start, to: start, squares: 0, stoppedBy, feetLeft };
    await token.update({ x: settled.x, y: settled.y }, { teleport: true, animate: false, [MODULE_ID]: { forcedMovement: true, reason } });
    return { moved: true, from: start, to: settled, squares: taken, stoppedBy, feetLeft };
}

/** Raise or lower a token's elevation (a rise, or a safe fall to the ground). */
export async function forcedElevation(tokenDoc, { rise = 0, fall = 0 }) {
    const token = tokenDoc?.document ?? tokenDoc;
    const now = Number(token?.elevation ?? 0);
    const to = rise ? now + rise : Math.max(0, now - fall);
    if (!token || to === now) return { moved: false, elevation: now };
    await token.update({ elevation: to }, { [MODULE_ID]: { forcedMovement: true } });
    return { moved: true, elevation: to };
}

/** The point of a Region nearest a token — a wall's line or rectangle, a burst's centre — to push away from. */
export function nearestRegionPoint(region, point) {
    let best = null;
    const consider = candidate => { const d = Math.hypot(candidate.x - point.x, candidate.y - point.y); if (!best || d < best.d) best = { ...candidate, d }; };
    for (const shape of region?.shapes ?? []) {
        const s = shape.toObject?.() ?? shape;
        if (s.type === "circle" || s.type === "emanation" || s.type === "ellipse" || s.type === "cone") consider({ x: Number(s.x), y: Number(s.y) });
        else if (s.type === "rectangle") consider({ x: Math.min(Math.max(point.x, s.x), s.x + s.width), y: Math.min(Math.max(point.y, s.y), s.y + s.height) });
        else if (s.type === "line") {
            const angle = Number(s.rotation ?? 0) * Math.PI / 180, x2 = s.x + Math.cos(angle) * Number(s.length), y2 = s.y + Math.sin(angle) * Number(s.length);
            const vx = x2 - s.x, vy = y2 - s.y, t = Math.max(0, Math.min(1, ((point.x - s.x) * vx + (point.y - s.y) * vy) / (vx * vx + vy * vy || 1)));
            consider({ x: s.x + t * vx, y: s.y + t * vy });
        } else if (s.type === "polygon" && Array.isArray(s.points)) {
            for (let i = 0; i < s.points.length; i += 2) {
                const ax = s.points[i], ay = s.points[i + 1], bx = s.points[(i + 2) % s.points.length], by = s.points[(i + 3) % s.points.length];
                const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((point.x - ax) * vx + (point.y - ay) * vy) / (vx * vx + vy * vy || 1)));
                consider({ x: ax + t * vx, y: ay + t * vy });
            }
        }
    }
    return best ? { x: best.x, y: best.y } : null;
}

/** Whether a point lies in any of an area's shapes (a Region's or a template's: circle, ellipse, rectangle, polygon, cone, line). */
export function pointInShapes(point, shapes) {
    const size = globalThis.canvas?.grid?.size ?? 100;
    return (shapes ?? []).some(raw => {
        const s = raw?.toObject?.() ?? raw;
        const dx = point.x - Number(s.x), dy = point.y - Number(s.y);
        if (s.type === "circle" || s.type === "emanation") return Math.hypot(dx, dy) <= Number(s.radius ?? 0) + 1e-6;
        if (s.type === "ellipse") return (dx * dx) / (Number(s.radiusX) ** 2) + (dy * dy) / (Number(s.radiusY) ** 2) <= 1 + 1e-6;
        if (s.type === "rectangle") return point.x >= s.x - 1e-6 && point.x <= s.x + Number(s.width) + 1e-6 && point.y >= s.y - 1e-6 && point.y <= s.y + Number(s.height) + 1e-6;
        if (s.type === "polygon" && Array.isArray(s.points)) {
            let inside = false;
            for (let i = 0, j = s.points.length - 2; i < s.points.length; j = i, i += 2) {
                const xi = s.points[i], yi = s.points[i + 1], xj = s.points[j], yj = s.points[j + 1];
                if ((yi > point.y) !== (yj > point.y) && point.x < (xj - xi) * (point.y - yi) / (yj - yi || 1e-9) + xi) inside = !inside;
            }
            return inside;
        }
        if (s.type === "cone") {
            const angle = Math.atan2(dy, dx) * 180 / Math.PI, facing = Number(s.rotation ?? 0);
            const off = Math.abs((((angle - facing) % 360) + 540) % 360 - 180);
            return Math.hypot(dx, dy) <= Number(s.radius) + 1e-6 && off <= Number(s.angle) / 2 + 1e-6;
        }
        if (s.type === "line") {
            const rad = Number(s.rotation ?? 0) * Math.PI / 180, length = Number(s.length), width = Number(s.width ?? size);
            const along = dx * Math.cos(rad) + dy * Math.sin(rad), across = -dx * Math.sin(rad) + dy * Math.cos(rad);
            return along >= -1e-6 && along <= length + 1e-6 && Math.abs(across) <= width / 2 + 1e-6;
        }
        return false;
    });
}

/**
 * The nearest unoccupied space for a token, ring by ring from where it stands: outside an area's shapes ("pushed to the nearest unoccupied space as the
 * stalagmite rises"), or only the adjacent squares ("pushed to an adjacent space"). Returns {x, y} or null.
 */
export function nearestFreeSpace(token, { outside = null, inside = null, adjacentOnly = false, size = globalThis.canvas?.grid?.size ?? 100 } = {}) {
    const rings = adjacentOnly ? 1 : 40;
    for (let ring = 1; ring <= rings; ring++) {
        const spots = [];
        for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
            if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
            const x = token.x + i * size, y = token.y + j * size;
            if (!insideScene(token, x, y, size) || blockersAt(token, x, y, size).length) continue;
            if (outside && pointInShapes(centre(token, x, y, size), outside)) continue;
            if (inside && !pointInShapes(centre(token, x, y, size), inside)) continue;
            spots.push({ x, y, d: Math.hypot(i, j) });
        }
        if (spots.length) { spots.sort((a, b) => a.d - b.d); return { x: spots[0].x, y: spots[0].y }; }
    }
    return null;
}

/** Move a token out of an area, into one, or to an adjacent space — the nearest unoccupied space: {moved, to} or {moved: false, reason}. */
export async function moveToFreeSpace(tokenDoc, { outside = null, inside = null, adjacentOnly = false, reason = "" } = {}) {
    const token = tokenDoc?.document ?? tokenDoc;
    if (!token?.parent) return { moved: false, reason: "no token" };
    const size = token.parent.grid?.size ?? canvas.grid.size;
    if (outside && !adjacentOnly && !pointInShapes(centre(token, token.x, token.y, size), outside)) return { moved: false, reason: "already outside" };
    if (inside && pointInShapes(centre(token, token.x, token.y, size), inside)) return { moved: false, reason: "already inside" };
    const spot = nearestFreeSpace(token, { outside, inside, adjacentOnly, size });
    if (!spot) return { moved: false, reason: "no free space" };
    const from = { x: token.x, y: token.y };
    await token.update({ x: spot.x, y: spot.y }, { teleport: true, animate: false, [MODULE_ID]: { forcedMovement: true, reason } });
    return { moved: true, from, to: spot };
}

