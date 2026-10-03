// Information a spell reveals about a creature (user decision 2026-10-01: the module reads PF2e's data and whispers it to the GM and the
// caster's player at the time the text says). The Parrot's Whisper: the target's highest weakness.
import { escapeHTML } from "./runtime-utils.js";

export const REVEAL_KINDS = new Set(["highest-weakness", "weaknesses-and-lowest-save", "intelligence-compare", "gm-command"]);

/** "higher", "equal" or "lower": the creature's Intelligence modifier against the caster's (Mind Reading). */
export function compareIntelligence(actor, caster) {
    const mod = subject => Number(subject?.abilities?.int?.mod ?? subject?.system?.abilities?.int?.mod ?? NaN);
    const own = mod(actor), theirs = mod(caster);
    if (!Number.isFinite(own) || !Number.isFinite(theirs)) return null;
    return own > theirs ? "higher" : own === theirs ? "equal" : "lower";
}

/** "fire 5" for each of the creature's highest weaknesses (all of them on a tie), or null when it has none. */
export function highestWeaknesses(actor) {
    const weaknesses = (actor?.system?.attributes?.weaknesses ?? []).map(entry => ({ type: String(entry.type ?? entry.label ?? ""), value: Number(entry.value ?? 0) }))
        .filter(entry => entry.type && Number.isFinite(entry.value));
    if (!weaknesses.length) return null;
    const top = Math.max(...weaknesses.map(entry => entry.value));
    return weaknesses.filter(entry => entry.value === top).map(entry => `${entry.type} ${entry.value}`);
}

/** Whispers what the spell reveals about the creature to the GM and the caster's owners. */
export async function revealInformation(actor, { kind, sourceActorUuid, spellName, text: command = null }) {
    if (!REVEAL_KINDS.has(kind)) throw new Error(`${spellName}: nothing to reveal (${kind}).`);
    const caster = sourceActorUuid ? await fromUuid(sourceActorUuid) : null;
    // A command to the GM only (user decision 2026-10-03): what to play or tell the caster's player.
    if (kind === "gm-command") return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster ?? undefined }), whisper: game.users.filter(user => user.isGM).map(user => user.id),
        content: `<p><strong>${escapeHTML(spellName)}</strong> — GM, ${escapeHTML(actor.name)}: ${escapeHTML(command ?? "")}</p>`,
        flags: { "pf2e-automatic-resolution": { kind: "reveal", reveal: { kind, actorUuid: actor.uuid, result: command } } } });
    let found = kind === "intelligence-compare" ? null : highestWeaknesses(actor), text = found ? `${actor.name}'s highest weakness: ${found.join(", ")}.` : `${actor.name} has no weaknesses.`;
    // Mind Reading: whether its Intelligence modifier is higher than, equal to, or lower than the caster's.
    if (kind === "intelligence-compare") {
        found = compareIntelligence(actor, caster);
        text = found ? `${actor.name}'s Intelligence modifier is ${found === "equal" ? "equal to" : `${found} than`} ${caster?.name ?? "the caster"}'s.` : `${actor.name}'s Intelligence can't be compared.`;
    }
    // Vision of Weakness: every weakness, and the lowest save (all of them on a tie).
    if (kind === "weaknesses-and-lowest-save") {
        const all = (actor?.system?.attributes?.weaknesses ?? []).map(entry => `${entry.type ?? entry.label} ${entry.value}`);
        const saves = ["fortitude", "reflex", "will"].map(slug => ({ slug, mod: Number(actor?.saves?.[slug]?.mod ?? NaN) })).filter(entry => Number.isFinite(entry.mod));
        const lowest = saves.length ? saves.filter(entry => entry.mod === Math.min(...saves.map(save => save.mod))).map(entry => entry.slug) : [];
        found = { weaknesses: all, lowestSave: lowest };
        text = `${actor.name}: ${all.length ? `weaknesses ${all.join(", ")}` : "no weaknesses"}; lowest save ${lowest.join(" and ") || "unknown"}.`;
    }
    const whisper = game.users.filter(user => user.isGM || (caster && caster.testUserPermission?.(user, "OWNER"))).map(user => user.id);
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster ?? undefined }), whisper,
        content: `<p><strong>${escapeHTML(spellName)}</strong>: ${escapeHTML(text)}</p>`,
        flags: { "pf2e-automatic-resolution": { kind: "reveal", reveal: { kind, actorUuid: actor.uuid, result: found } } } });
}
