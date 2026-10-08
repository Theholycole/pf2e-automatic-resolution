// Distance between two tokens from their documents, not their canvas objects:
// canvas placeables lag behind (or sit at 0,0 when the scene isn't rendered)
// while the documents already hold the new positions. PF2e counts squares
// between the nearest occupied squares and alternates diagonals (5-10-5).

/** Squares between two token footprints ({x, y, width, height}, width/height in grid squares). */
export function footprintSquares(a, b, gridSize) {
    const axis = (start, size, otherStart, otherSize) => {
        const from = Math.round(start / gridSize), to = Math.round(otherStart / gridSize);
        const gap = Math.max(to - (from + size), from - (to + otherSize));
        return gap >= 0 ? gap + 1 : 0;
    };
    // (A Tiny creature's half-square token is measured from the square it's in, as PF2e measures it — not as half a square: a familiar's
    // 10-foot emanation reaches the creature two squares away.)
    const squares = size => Math.max(1, Math.round(Number(size) || 1));
    const dx = axis(a.x, squares(a.width), b.x, squares(b.width));
    const dy = axis(a.y, squares(a.height), b.y, squares(b.height));
    return Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2);
}

export function tokenDocumentDistance(a, b, { gridSize, gridDistance }) {
    return footprintSquares(a, b, gridSize) * gridDistance;
}

/** Foundry wrapper: distance in feet between two tokens or token documents. */
export function tokenDistance(a, b) {
    const docA = a?.document ?? a, docB = b?.document ?? b;
    return tokenDocumentDistance(docA, docB, { gridSize: canvas.grid.size, gridDistance: canvas.dimensions.distance });
}
