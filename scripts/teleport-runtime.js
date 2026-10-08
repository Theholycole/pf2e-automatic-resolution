// Moving tokens for teleportation and movement spells (user decision 2026-10-03: teleports on the battle map are the module's):
//   - a space for a token, picked on the canvas (or given), within the stated feet of where it's measured from (the caster, or the token itself), entirely
//     inside that range when the text says "within the area", and unoccupied; the token is then moved there at once (Foundry's teleport, no animation);
//   - two tokens swapping places;
//   - a token raised or lowered (elevation), with the fall's distance.
import { footprintSquares } from "./token-distance.js";

const MODULE_ID = "pf2e-automatic-resolution";

const docOf = token => token?.document ?? token;
const footprint = (doc, at = doc) => ({ x: at.x, y: at.y, width: Number(doc.width) || 1, height: Number(doc.height) || 1 });
const feet = (a, b) => footprintSquares(a, b, canvas.grid.size) * canvas.dimensions.distance;

/** Whether a token placed at {x, y} overlaps another token (the moving tokens excepted). */
export function occupied(doc, at, ignore = []) {
    const size = canvas.grid.size, w = (Number(doc.width) || 1) * size, h = (Number(doc.height) || 1) * size;
    return canvas.scene.tokens.some(other => other.id !== doc.id && !ignore.includes(other.id) && !other.hidden
        && at.x < other.x + other.width * size && at.x + w > other.x && at.y < other.y + other.height * size && at.y + h > other.y);
}

/** The problem with moving a token's footprint to {x, y}, or null: inside the scene, within the feet of the origin (every square when `entirely`), unoccupied. */
export function destinationProblem(doc, at, { origin = null, within = null, entirely = false, ignore = [] } = {}) {
    const rect = canvas.dimensions.sceneRect, size = canvas.grid.size;
    const place = footprint(doc, at);
    if (at.x < rect.x || at.y < rect.y || at.x + place.width * size > rect.x + rect.width || at.y + place.height * size > rect.y + rect.height) return "That space is off the map.";
    if (origin && Number.isFinite(within)) {
        const squares = [];
        for (let dx = 0; dx < (entirely ? place.width : 1); dx++) for (let dy = 0; dy < (entirely ? place.height : 1); dy++) squares.push({ x: at.x + dx * size, y: at.y + dy * size, width: 1, height: 1 });
        const from = footprint(docOf(origin));
        const far = entirely ? Math.max(...squares.map(square => feet(from, square))) : feet(from, place);
        if (far > within) return `That space is ${far} feet away; the spell allows ${within}.`;
    }
    if (occupied(doc, at, ignore)) return "That space is occupied.";
    return null;
}

/** A space picked on the canvas: the next left click (snapped to the grid for the token's size); a right click or Escape cancels. */
export function pickSpace(doc, label) {
    return new Promise(resolve => {
        ui.notifications?.info?.(`${label}: click the destination space (right-click to cancel).`);
        const stage = canvas.stage;
        const finish = value => { stage.off("pointerdown", down); document.removeEventListener("keydown", key); resolve(value); };
        const down = event => {
            if (event.button === 2) return finish(null);
            const point = event.getLocalPosition?.(canvas.tokens) ?? event.data?.getLocalPosition?.(canvas.tokens);
            if (!point) return finish(null);
            const size = canvas.grid.size, w = (Number(doc.width) || 1) * size, h = (Number(doc.height) || 1) * size;
            const snapped = canvas.grid.getTopLeftPoint?.({ x: point.x - w / 2 + size / 2, y: point.y - h / 2 + size / 2 }) ?? { x: Math.floor((point.x - w / 2 + size / 2) / size) * size, y: Math.floor((point.y - h / 2 + size / 2) / size) * size };
            finish({ x: snapped.x, y: snapped.y });
        };
        const key = event => { if (event.key === "Escape") finish(null); };
        stage.on("pointerdown", down);
        document.addEventListener("keydown", key);
    });
}

/** Moves a token to a checked space (given, or picked); returns {from, to} or {status: "cancelled"}. */
export async function teleportToken(token, { destination = null, origin = null, within = null, entirely = false, label = "Teleport", ignore = [] } = {}) {
    const doc = docOf(token);
    const at = destination ?? await pickSpace(doc, label);
    if (!at) return { status: "cancelled" };
    const problem = destinationProblem(doc, at, { origin, within, entirely, ignore });
    if (problem) throw new Error(`${label}: ${problem}`);
    const from = { x: doc.x, y: doc.y };
    await doc.update({ x: at.x, y: at.y }, { teleport: true, animate: false, [MODULE_ID]: { teleported: true } });
    return { from, to: { x: at.x, y: at.y } };
}

/** Two tokens trade places (each to the other's top-left corner). */
export async function swapTokens(a, b) {
    const one = docOf(a), two = docOf(b);
    const first = { x: one.x, y: one.y }, second = { x: two.x, y: two.y };
    await canvas.scene.updateEmbeddedDocuments("Token", [{ _id: one.id, x: second.x, y: second.y }, { _id: two.id, x: first.x, y: first.y }], { teleport: true, animate: false, [MODULE_ID]: { teleported: true } });
    return { swapped: [one.uuid, two.uuid] };
}

/** A token raised or lowered by the stated feet (not below the ground); returns how far it moved. */
export async function changeElevation(token, by) {
    const doc = docOf(token);
    const from = Number(doc.elevation ?? 0), to = Math.max(0, from + Number(by));
    await doc.update({ elevation: to }, { animate: false });
    return { from, to, moved: Math.abs(to - from) };
}

/** The first free space for a token in the ring around another (adjacent first), or null. */
export function freeSpaceBeside(anchor, token, rings = 3) {
    const a = docOf(anchor), doc = docOf(token), size = canvas.grid.size;
    const w = Number(doc.width) || 1, h = Number(doc.height) || 1, aw = Number(a.width) || 1, ah = Number(a.height) || 1;
    for (let ring = 1; ring <= rings; ring++) for (let dy = -ring - h + 1; dy <= ah + ring - 1; dy++) for (let dx = -ring - w + 1; dx <= aw + ring - 1; dx++) {
        const gapX = dx < 0 ? -dx - w + 1 : Math.max(0, dx - aw + 1), gapY = dy < 0 ? -dy - h + 1 : Math.max(0, dy - ah + 1);
        if (Math.max(gapX, gapY) !== ring) continue;
        const at = { x: a.x + dx * size, y: a.y + dy * size };
        if (!destinationProblem(doc, at, { ignore: [doc.id] })) return at;
    }
    return null;
}
