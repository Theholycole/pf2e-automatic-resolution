export function escapeHTML(value) {
    const text = String(value ?? "");
    if (globalThis.foundry?.utils?.escapeHTML) return foundry.utils.escapeHTML(text);
    return text.replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
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
