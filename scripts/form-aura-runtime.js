// A form's aura around its caster (Monstrosity Form's Shroud of Flame, Qi Form's corona, Arcane Explosion's unfiltered magic): a region on the caster's
// token that follows it, dealing its damage (or its save) by itself; and what a form does when its Effect ends (its auras end, full Hit Points).
import { freeSpaceBeside } from "./teleport-runtime.js";
import { MODULE_ID, escapeHTML, activeGM as leadGM } from "./runtime-utils.js";

/** The aura's region and its lingering record; returns the record's castId. */
export async function startFollowingAura(ongoing, { spellName, sourceActor, sourceItemUuid, castRank, aura, type = null, dc = null, durationSeconds, parentCastId = null, radius = aura.radius }) {
    if (!ongoing?.startRegionArea) throw new Error(`${spellName} needs the ongoing spell manager.`);
    const casterToken = sourceActor.getActiveTokens?.(true, true)?.[0];
    if (!casterToken) throw new Error(`${spellName}: ${sourceActor.name} needs a token on the scene for ${aura.label}.`);
    const size = canvas.scene.grid.size, pixels = (Number(radius) / canvas.scene.grid.distance + casterToken.width / 2) * size;
    const centre = { x: casterToken.x + casterToken.width * size / 2, y: casterToken.y + casterToken.height * size / 2 };
    const [region] = await canvas.scene.createEmbeddedDocuments("Region", [{ name: `${spellName}: ${aura.label}`, color: "#cc6633",
        shapes: [{ type: "circle", x: centre.x, y: centre.y, radius: pixels }], flags: { [MODULE_ID]: { followToken: casterToken.uuid, followShape: "emanation", followRadius: pixels } } }]);
    if (!aura.save && !/^[a-z]+$/.test(String(type ?? aura.type ?? ""))) throw new Error(`${spellName}: ${aura.label}'s damage type wasn't chosen.`);
    const started = await ongoing.startRegionArea({ spellName: `${spellName}: ${aura.label}`, sourceActorUuid: sourceActor.uuid, sourceItemUuid, castRank, region,
        // (Creatures already inside when it appears didn't enter it.)
        durationSeconds, events: [...aura.events], excludeCaster: true, seedMembers: true, ...(aura.oncePerTurn ? { hazardOncePerTurn: true } : {}), ...(aura.oncePerRound ? { hazardOncePerRound: true } : {}),
        ...(parentCastId ? { parentCastId } : {}), ...(Number.isFinite(Number(dc)) ? { dc: Number(dc) } : {}),
        hazardDamage: aura.save ? { conditionSave: { ...foundry.utils.deepClone(aura.save), dc: Number(dc) }, label: aura.label }
            // (A basic save against the aura's damage: Control Sand's sandstorm.)
            // (A Heightened rank's extra die: Monstrosity Form's shroud at 9th.)
            : { formula: [...(aura.byRank ?? [])].sort((a, b) => a.minRank - b.minRank).filter(entry => Number(castRank) >= entry.minRank).at(-1)?.formula ?? aura.formula,
                type: type ?? aura.type, label: aura.label, ...(aura.basic ? { basic: { statistic: aura.basic, dc: Number(dc) } } : {}) } });
    return started.castId;
}

/** A form's Effect ended: its auras end with it; "returning to your normal state at maximum Hit Points" (Arcane Explosion). */
export async function formEnded(item, ongoing) {
    if (!leadGM() || item?.type !== "effect") return null;
    const data = item.flags?.[MODULE_ID]?.formRiders, actor = item.actor;
    if (!data || !actor) return null;
    const ended = [];
    for (const castId of Object.values(data.auras ?? {}).filter(Boolean)) {
        const journal = ongoing?.find?.(castId);
        const status = journal?.getFlag?.(MODULE_ID, "ongoingCast")?.status;
        if (journal && status && status !== "ended") { await ongoing.end(journal, { reason: "form-ended" }).catch(() => {}); ended.push(castId); }
    }
    // (Amalgamizing Leap: the fused target separates into a space beside the caster.)
    if (data.fusedTokenUuid) {
        const fused = await fromUuid(data.fusedTokenUuid).catch(() => null), own = actor.getActiveTokens?.(true, true)?.[0];
        const anchor = own?.document ?? own;
        if (fused && anchor) {
            const at = freeSpaceBeside(anchor, fused) ?? { x: fused.x, y: fused.y };
            await fused.update({ x: at.x, y: at.y, hidden: false }, { teleport: true, animate: false });
            try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.spellName ?? item.name)}:</strong> ${escapeHTML(fused.name)} separates from ${escapeHTML(actor.name)} into an adjacent space.</p>` }); } catch (_) {}
        }
    }
    // (Metamorphosis: the form it took goes with it.)
    for (const uuid of data.formEffects ?? []) { const form = await fromUuid(uuid).catch(() => null); if (form) await form.delete().catch(() => {}); }
    // (Its toggle's conditions go with it.)
    const children = (actor.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.toggleGrant?.parentId === item.id).map(effect => effect.id);
    if (children.length) await actor.deleteEmbeddedDocuments("Item", children);
    if (data.endFullHp) {
        const hp = actor.system?.attributes?.hp;
        if (hp && Number(hp.value) < Number(hp.max)) await actor.update({ "system.attributes.hp.value": Number(hp.max) });
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${escapeHTML(data.spellName ?? item.name)}:</strong> ${escapeHTML(actor.name)} returns to its normal form at maximum Hit Points.</p>` }); } catch (_) {}
    }
    return { ended, fullHp: !!data.endFullHp };
}

/** A form's toggle that grants a condition (Blanket of Stars' night sky: still → Invisible, moving → Concealed): the condition's Effect follows the toggle. */
export async function syncToggleGrants(item) {
    if (!leadGM() || item?.type !== "effect") return null;
    const grants = item.flags?.[MODULE_ID]?.formRiders?.toggleGrants, actor = item.actor;
    if (!Array.isArray(grants) || !grants.length || !actor) return null;
    const changed = [];
    for (const grant of grants) {
        const rule = (item.system?.rules ?? []).find(entry => entry.key === "RollOption" && entry.option === grant.option);
        const wanted = rule?.value === true && rule.selection === grant.selection;
        const existing = (actor.itemTypes?.effect ?? []).filter(effect => effect.flags?.[MODULE_ID]?.toggleGrant?.parentId === item.id && effect.flags[MODULE_ID].toggleGrant.selection === grant.selection);
        if (wanted && !existing.length) {
            await actor.createEmbeddedDocuments("Item", [{ name: `${item.name}: ${grant.name}`, type: "effect", img: "icons/svg/aura.svg",
                flags: { [MODULE_ID]: { toggleGrant: { parentId: item.id, option: grant.option, selection: grant.selection } } },
                system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, tokenIcon: { show: false },
                    description: { value: `<p>${escapeHTML(grant.name)} while ${escapeHTML(item.name)}'s toggle is on ${escapeHTML(grant.selection)}.</p>` },
                    rules: [{ key: "GrantItem", uuid: grant.uuid, flag: "toggleGrant", allowDuplicate: true, onDeleteActions: { grantee: "cascade" } }] } }]);
            changed.push(`+${grant.selection}`);
        } else if (!wanted && existing.length) {
            await actor.deleteEmbeddedDocuments("Item", existing.map(effect => effect.id));
            changed.push(`-${grant.selection}`);
        }
    }
    return changed;
}
