export function escapeHTML(value) {
    const text = String(value ?? "");
    if (globalThis.foundry?.utils?.escapeHTML) return foundry.utils.escapeHTML(text);
    return text.replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
}

/**
 * A modifyMovementCost behavior's difficulties for terrain that hinders the listed movement types. Terrain on the ground also applies to PF2e's
 * "travel" action (how a creature moves outside combat), which Foundry costs separately from "walk"; fly-only terrain stays fly-only.
 */
export function terrainDifficulties(movement, difficulty) {
    const types = [...movement];
    if (types.includes("walk") && !types.includes("travel")) types.push("travel");
    return Object.fromEntries(types.map(type => [type, difficulty]));
}

export function clone(value) {
    return foundry.utils.deepClone(value);
}

export function randomID() {
    return foundry.utils.randomID();
}

export function actorFromTarget(target) {
    if (!target) return null;
    if (target.documentName === "Actor") return target;
    return target.actor ?? target.document?.actor ?? null;
}

export function activeUsers() {
    return (game.users?.contents ?? [...(game.users ?? [])])
        .filter(user => user.active)
        .sort((left, right) => left.id.localeCompare(right.id));
}

export async function confirmAction({ title, content, label }) {
    const result = await foundry.applications.api.DialogV2.prompt({
        window: { title },
        content,
        ok: { label, callback: () => true },
        rejectClose: false,
        modal: true
    });
    return result === true;
}

/**
 * A spell at its cast rank. PF2e applies fixed-level heightening data (Dehydrate's 4d6 at 3rd) only when it loads that rank, so a spell
 * already at the cast rank is loaded too when it has such levels up to that rank.
 */
export function spellAtCastRank(item, castRank) {
    if (typeof item?.loadVariant !== "function" || !Number.isFinite(Number(castRank))) return item;
    const fixedLevels = item.system?.heightening?.type === "fixed" && Object.keys(item.system.heightening.levels ?? {}).some(rank => Number(rank) <= Number(castRank));
    if (Number(item.rank) === Number(castRank) && !fixedLevels) return item;
    try { return item.loadVariant({ castRank: Number(castRank) }) ?? item; } catch { return item; }
}
