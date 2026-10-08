// What a module note does when it ends, and while it lasts, for its creature (the active GM only):
//   - thenCondition: "At the end of your turn, the creature is no longer controlled and becomes Stunned 1" — the condition on its own Effect,
//     which ends when PF2e removes the condition (and carries the note's Hit Point share);
//   - endsInDeath: "Creatures animated with this spell die again once the spell ends" — 0 Hit Points and PF2e's Dead status;
//   - hpShare: "If the creature loses any Hit Points for any reason while it's possessed or stunned by this ability, you lose Hit Points equal to
//     half that amount" — the caster loses that share (no resistances: lost, not damaged).

/** A deleted note's after-effects. */
import { MODULE_ID, activeGM as leadGM } from "./runtime-utils.js";

export async function noteEndAfter(item, options = {}) {
    if (!leadGM() || item?.type !== "effect") return null;
    const data = item.flags?.[MODULE_ID]?.runtime;
    const actor = item.actor;
    // (Cleanup — the cast ended early, the GM cleared it — doesn't trigger what the note's natural end does.)
    if (!data || !actor || options?.[MODULE_ID]?.ongoingCleanup) return null;
    const done = {};
    if (data.thenCondition) {
        const { uuid, slug, value } = data.thenCondition;
        const name = `${slug[0].toUpperCase()}${slug.slice(1)}${value ? ` ${value}` : ""}`;
        const [effect] = await actor.createEmbeddedDocuments("Item", [{ name: `${data.sourceItemName}: ${name}`, type: "effect", img: "icons/svg/downgrade.svg",
            flags: { [MODULE_ID]: { runtime: { schema: 1, kind: "note-after", castInstanceId: data.castInstanceId, sourceActorUuid: data.sourceActorUuid, sourceItemName: data.sourceItemName,
                ...(data.hpShare ? { hpShare: { ...data.hpShare } } : {}) } } },
            system: { duration: { value: -1, unit: "unlimited", expiry: null, sustained: false }, description: { value: `<p>${name} from <strong>${data.sourceItemName}</strong>; this ends when the condition does.</p>` },
                rules: [{ key: "GrantItem", uuid, onDeleteActions: { grantee: "cascade" }, ...(value ? { alterations: [{ mode: "override", property: "badge-value", value }] } : {}) }] } }]);
        done.thenCondition = effect?.uuid ?? null;
    }
    if (data.endsInDeath) {
        await actor.update({ "system.attributes.hp.temp": 0, "system.attributes.hp.value": 0 });
        if (!actor.statuses?.has?.("dead")) await actor.toggleStatusEffect?.("dead", { overlay: true, active: true });
        done.dead = true;
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${data.sourceItemName}</strong> ended: ${actor.name} dies again.</p>` }); } catch (_) {}
    }
    return done;
}

/** A creature lost Hit Points: the caster's share for each of its notes that shares them. */
export async function hpShareOnLoss(actor, lost) {
    if (!leadGM() || !actor || !(Number(lost) > 0)) return [];
    const shared = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.runtime;
        if (!data?.hpShare) continue;
        const caster = data.sourceActorUuid ? await fromUuid(data.sourceActorUuid) : null;
        if (!caster || caster === actor) continue;
        const amount = Math.floor(Number(lost) * data.hpShare.fraction);
        if (!(amount > 0)) continue;
        const hp = caster.system?.attributes?.hp;
        await caster.update({ "system.attributes.hp.value": Math.max(0, Number(hp?.value ?? 0) - amount) });
        shared.push({ casterUuid: caster.uuid, amount });
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${data.sourceItemName}:</strong> ${actor.name} lost ${lost} Hit Points; ${caster.name} loses ${amount}.</p>` }); } catch (_) {}
    }
    return shared;
}

/** A conjured creature that ends its spell when it dies (Dragon Turret's dragon): at 0 Hit Points, the caster's Effect for it ends (removing it). */
export async function summonEndsAtZero(actor) {
    const summoned = actor?.flags?.[MODULE_ID]?.summoned;
    if (!leadGM() || !summoned?.endsAtZero || Number(actor.system?.attributes?.hp?.value ?? 1) > 0) return null;
    // (A ritual's hive ends its ritual later, not at once — Mosquito Blight's hour: main.js's updateActor hook shortens it.)
    if (summoned.endsAfter) return null;
    const caster = summoned.casterUuid ? await fromUuid(summoned.casterUuid) : null;
    const effect = caster?.itemTypes?.effect?.find(entry => entry.flags?.[MODULE_ID]?.summon?.actorUuid === actor.uuid);
    if (!effect) return null;
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${summoned.spell}:</strong> ${actor.name} is destroyed; the spell ends.</p>` }); } catch (_) {}
    await effect.delete();
    return effect.uuid;
}

/** A form that ends at 0 Hit Points leaving 1 (Patron's Protector): the creature at 1 and its note ended. */
export async function zeroToOneOnLoss(actor) {
    if (!leadGM() || Number(actor?.system?.attributes?.hp?.value ?? 1) > 0) return null;
    const note = actor.itemTypes?.effect?.find(effect => effect.flags?.[MODULE_ID]?.runtime?.zeroToOne);
    if (!note) return null;
    await actor.update({ "system.attributes.hp.value": 1 });
    await note.delete();
    try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${note.flags[MODULE_ID].runtime.sourceItemName}:</strong> ${actor.name} drops to 0 Hit Points: the spell ends, and it's at 1 Hit Point instead.</p>` }); } catch (_) {}
    return note.uuid;
}

/** A summon tied to a dying creature (Gray Shadow): it ends when that creature dies or regains consciousness (no longer Dying). */
export async function dyingLinkCheck(actor) {
    if (!leadGM() || !actor) return [];
    const ended = [];
    const dead = actor.statuses?.has?.("dead") || (actor.isDead === true);
    if (actor.hasCondition?.("dying") && !dead) return ended;
    for (const caster of game.actors) for (const effect of caster.itemTypes?.effect ?? []) {
        if (effect.flags?.[MODULE_ID]?.summon?.linkedDying !== actor.uuid) continue;
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: caster }), content: `<p><strong>${effect.name}:</strong> ${actor.name} ${dead ? "died" : "is no longer dying"}; the summon disappears and the spell ends.</p>` }); } catch (_) {}
        await effect.delete();
        ended.push(effect.uuid);
    }
    return ended;
}

/** A note ended by damage ("until it takes a total of 50 damage", Volcanic Eruption): the damage the creature takes adds up; at the total it ends. */
export async function damageLimitOnLoss(actor, lost) {
    if (!leadGM() || !actor || !(Number(lost) > 0)) return [];
    const ended = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const data = effect.flags?.[MODULE_ID]?.runtime;
        if (!data?.damageLimit) continue;
        const taken = Number(data.damageTaken ?? 0) + Number(lost);
        if (taken < data.damageLimit) { await effect.update({ [`flags.${MODULE_ID}.runtime.damageTaken`]: taken }); continue; }
        await effect.delete();
        ended.push(effect.uuid);
        try { await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${data.sourceItemName}:</strong> ${actor.name} has taken ${taken} damage: ${effect.name.replace(/^[^:]+: /, "")} ends.</p>` }); } catch (_) {}
    }
    return ended;
}

/** A note that lasts with a condition (Calcification, Vitrifying Blast): ended when the creature no longer has it; its Weakness the value × the multiplier. */
export async function withConditionSync(actor) {
    if (!leadGM() || !actor) return [];
    const changed = [];
    for (const effect of actor.itemTypes?.effect ?? []) {
        const link = effect.flags?.[MODULE_ID]?.runtime?.withCondition;
        if (!link) continue;
        const value = Number(actor.getCondition?.(link.slug)?.value ?? (actor.hasCondition?.(link.slug) ? 1 : 0));
        if (!value) { await effect.delete(); changed.push({ uuid: effect.uuid, ended: true }); continue; }
        if (!link.multiplier) continue;
        const rules = foundry.utils.deepClone(effect.system.rules ?? []);
        let touched = false;
        for (const rule of rules) if (rule.key === "Weakness" && rule.value !== value * link.multiplier) { rule.value = value * link.multiplier; touched = true; }
        if (touched) { await effect.update({ "system.rules": rules }); changed.push({ uuid: effect.uuid, value: value * link.multiplier }); }
    }
    return changed;
}

