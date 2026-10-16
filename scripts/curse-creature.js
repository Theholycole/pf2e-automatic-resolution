// A curse stage that brings a creature (Gift of Dusk, PF2e 8.6): "Enfeebled 4 and the shadow detaches as an independent creature. Use the statistics for a
// Shadow, though it can't create shadow spawn. The shadow is friendly to the curse's caster and hostile to the creature it was attached to. The stage can't be
// reduced until the shadow is slain, which immediately ends the curse."
// Pseudo Afflictions runs the curse's stages; the handoff writes `stageCreature` onto its Effect. When the Effect reaches that stage the active GM places the
// creature beside the afflicted one, on the caster's side; while it lives, the curse's stage can't go below that stage; when it's slain, the curse ends.
import { MODULE_ID, activeGM as leadGM } from "./runtime-utils.js";
import { freeSpaceNear } from "./effect-runtime.js";

const escapeHTML = value => foundry.utils.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
const stageOf = effect => Number(effect?.badge?.value ?? effect?.system?.badge?.value ?? 0);
// (Effects whose creature is being placed: a second update of the stage meanwhile doesn't place another.)
const placing = new Set();

/** The flag the handoff writes onto the handler's curse Effect. */
export function stageCreatureFlag(creature, state) {
    return { stage: creature.stage, uuid: creature.uuid, name: creature.name, what: creature.what ?? "creature", note: creature.note ?? null,
        locksStage: creature.locksStage === true, endsCurseWhenSlain: creature.endsCurseWhenSlain === true,
        casterUuid: state.sourceActorUuid ?? null, spellName: state.spellName ?? null, castId: state.castId ?? null, spawned: null };
}

/** The curse's creature while it lives (its actor at more than 0 Hit Points), or null. */
function livingCreature(data) {
    if (!data?.spawned?.actorUuid) return null;
    const actor = fromUuidSync(data.spawned.actorUuid);
    if (!actor || Number(actor.system?.attributes?.hp?.value ?? 0) <= 0) return null;
    return actor;
}

/**
 * preUpdateItem: the curse's stage can't be reduced below the creature's while the creature lives (Pseudo Afflictions' recovery save, or a hand-set badge).
 * The update keeps its other changes; the stage stays.
 */
export function holdCurseStage(item, changes) {
    const data = item?.flags?.[MODULE_ID]?.stageCreature;
    const next = foundry.utils.getProperty(changes ?? {}, "system.badge.value");
    if (!data?.locksStage || next == null || Number(next) >= data.stage || stageOf(item) < data.stage) return false;
    const creature = livingCreature(data);
    if (!creature) return false;
    foundry.utils.setProperty(changes, "system.badge.value", data.stage);
    ui.notifications?.info(`${item.name}: the stage can't be reduced while ${creature.name} lives.`);
    return true;
}

/** The disposition for the caster's side: its token's on the scene, else from its alliance. */
function casterDisposition(caster, scene) {
    const token = caster?.getActiveTokens?.(false, true)?.find(entry => entry.parent === scene) ?? caster?.getActiveTokens?.(false, true)?.[0];
    if (token) return token.disposition;
    const alliance = caster?.alliance ?? caster?.system?.details?.alliance;
    return alliance === "party" ? CONST.TOKEN_DISPOSITIONS.FRIENDLY : alliance === "opposition" ? CONST.TOKEN_DISPOSITIONS.HOSTILE : CONST.TOKEN_DISPOSITIONS.NEUTRAL;
}

/** createItem/updateItem: the curse reached the creature's stage — the creature placed beside the afflicted creature (the active GM, once). */
export async function curseCreatureCheck(item) {
    const data = item?.flags?.[MODULE_ID]?.stageCreature;
    if (!leadGM() || item?.type !== "effect" || !data || data.spawned || stageOf(item) < data.stage || !item.actor || placing.has(item.uuid)) return null;
    placing.add(item.uuid);
    try { return await placeCreature(item, data); } finally { placing.delete(item.uuid); }
}

async function placeCreature(item, data) {
    const host = item.actor.getActiveTokens?.(false, true)?.[0];
    const source = await fromUuid(data.uuid);
    const caster = data.casterUuid ? await fromUuid(data.casterUuid) : null;
    if (!host || source?.documentName !== "Actor") {
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), whisper: ChatMessage.getWhisperRecipients("GM").map(user => user.id),
            content: `<p><strong>${escapeHTML(item.name)}:</strong> stage ${data.stage} — place the ${escapeHTML(data.name)} yourself (${host ? "its statistics are unavailable" : `${escapeHTML(item.actor.name)} has no token`}).</p>` }); } catch (_) {}
        await item.setFlag(MODULE_ID, "stageCreature.spawned", { manual: true });
        return { status: "manual" };
    }
    const scene = host.parent;
    const disposition = casterDisposition(caster, scene);
    const actorData = game.actors.fromCompendium(source);
    actorData.name = `${source.name} (${item.actor.name}'s ${data.what})`;
    foundry.utils.setProperty(actorData, "system.details.alliance", caster?.alliance ?? caster?.system?.details?.alliance ?? null);
    actorData.prototypeToken = { ...(actorData.prototypeToken ?? {}), actorLink: true, disposition, name: actorData.name };
    actorData.flags = foundry.utils.mergeObject(actorData.flags ?? {}, { [MODULE_ID]: { curseCreature: { effectUuid: item.uuid, hostUuid: item.actor.uuid, casterUuid: data.casterUuid, spellName: data.spellName,
        endsCurseWhenSlain: data.endsCurseWhenSlain } } });
    const actor = await Actor.create(actorData);
    let token;
    try {
        const place = freeSpaceNear(host.document ?? host, actor.prototypeToken, 30);
        if (!place) throw new Error(`${item.name}: there's no free space near ${item.actor.name}.`);
        [token] = await scene.createEmbeddedDocuments("Token", [(await actor.getTokenDocument({ x: place.x, y: place.y, actorLink: true, disposition })).toObject()]);
    } catch (error) {
        await actor.delete().catch(() => null);
        throw error;
    }
    await item.setFlag(MODULE_ID, "stageCreature.spawned", { actorUuid: actor.uuid, tokenUuid: token.uuid });
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }),
        content: `<h3>${escapeHTML(data.spellName ?? item.name)}</h3><p>${escapeHTML(item.actor.name)}'s ${escapeHTML(data.what)} detaches as <strong>${escapeHTML(actor.name)}</strong>, friendly to ${escapeHTML(caster?.name ?? "the caster")} and hostile to ${escapeHTML(item.actor.name)}.${data.note ? ` ${escapeHTML(data.note)}` : ""}</p>`
            + `<p>${data.locksStage ? `The curse's stage can't be reduced while it lives; ` : ""}${data.endsCurseWhenSlain ? "slaying it ends the curse." : ""}</p>` }); } catch (_) {}
    return { status: "applied", actorUuid: actor.uuid, tokenUuid: token.uuid };
}

/** updateActor: the curse's creature slain (0 Hit Points) — the curse ends (the active GM). */
export async function curseCreatureSlain(actor) {
    const data = actor?.flags?.[MODULE_ID]?.curseCreature;
    if (!leadGM() || !data?.endsCurseWhenSlain || Number(actor.system?.attributes?.hp?.value ?? 1) > 0) return null;
    const curse = data.effectUuid ? await fromUuid(data.effectUuid) : null;
    if (!curse) return null;
    const host = curse.actor;
    await curse.delete();
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: host }), content: `<p><strong>${escapeHTML(data.spellName ?? curse.name)}:</strong> ${escapeHTML(actor.name)} is slain; the curse on ${escapeHTML(host?.name ?? "its creature")} ends.</p>` }); } catch (_) {}
    return curse.uuid;
}
