// The spell a cast came from. A spell cast from a wand, scroll or other item is PF2e's copy built for that cast: its UUID
// ("Actor.….Item.<the stored spell's id>") names no item on the actor, so a later fromUuid finds nothing. The resolver tries, in order:
// the item itself; the spell stored in a wand or scroll the caster still holds; the source copy taken when the cast started (a record's
// `spellSource`, a save card's `originalSpellSource`, or this session's memory of the cast).
const remembered = new Map();

/** Keep a cast spell's source for this session (the chat card or the start of a resolution). */
export function rememberCastSpell(item) {
    if (item?.type !== "spell" || !item.uuid || typeof item.toObject !== "function") return;
    remembered.set(item.uuid, { source: item.toObject(), actorUuid: item.actor?.uuid ?? null });
}

/** The source to persist on a durable record when its spell isn't a real item (a wand or scroll's), or null. */
export async function castSpellSource(uuid) {
    if (!uuid) return null;
    let found = null;
    try { found = await fromUuid(uuid); } catch (_) { found = null; }
    if (found?.type === "spell" && found.parent?.items?.get?.(found.id) === found) return null;
    return remembered.get(uuid)?.source ?? (found?.type === "spell" && typeof found.toObject === "function" ? found.toObject() : null);
}

/** The cast's spell document from anything holding `sourceItemUuid` (and optionally `sourceActorUuid`, `spellSource`, `originalSpellSource`). */
export async function castSpellFromUuid(holder) {
    const uuid = holder?.sourceItemUuid;
    if (!uuid) return null;
    let found = null;
    try { found = await fromUuid(uuid); } catch (_) { found = null; }
    if (found?.type === "spell") return found;
    const memory = remembered.get(uuid);
    const actorUuid = holder.sourceActorUuid ?? memory?.actorUuid ?? (/^(.*)\.Item\.[^.]+$/.exec(uuid)?.[1] ?? null);
    let actor = null;
    try { actor = actorUuid ? await fromUuid(actorUuid) : null; } catch (_) { actor = null; }
    // (A wand or scroll the caster still holds: PF2e's own copy of its stored spell.)
    const id = uuid.split(".").at(-1);
    const held = actor?.items?.find?.(item => item.type === "consumable" && item.embeddedSpell?.id === id)?.embeddedSpell;
    if (held) return spellFromSource(held.toObject(), actor);
    const source = holder.spellSource ?? holder.originalSpellSource ?? memory?.source ?? null;
    if (source && actor) return spellFromSource(source, actor);
    return found;
}

/**
 * A spell document from a stored copy, owned by the caster. A wand or scroll's spell has no spellcasting entry (PF2e picks one only as it
 * casts), and PF2e computes its damage, DC and attack from that entry: the copy is tied to the caster's entry of one of the spell's
 * traditions (as PF2e's own cast from the item would be), or the caster's first entry.
 */
export function spellFromSource(source, actor) {
    const clone = foundry.utils.deepClone(source);
    const own = new CONFIG.Item.documentClass(clone, { parent: actor });
    if (own.spellcasting || !actor?.spellcasting) return own;
    const traditions = new Set(source?.system?.traits?.traditions ?? []);
    const entries = [...actor.spellcasting].filter(entry => entry.isOfType?.("spellcastingEntry"));
    const entry = entries.find(candidate => traditions.has(candidate.tradition)) ?? entries[0];
    if (!entry) return own;
    return new CONFIG.Item.documentClass(foundry.utils.mergeObject(foundry.utils.deepClone(source), { "system.location.value": entry.id }, { inplace: false }), { parent: actor });
}

/** A remembered cast spell's source by UUID (a used-up scroll's, kept from just before PF2e deleted it), or null. */
export function rememberedCastSpell(uuid) {
    return remembered.get(uuid) ?? null;
}
