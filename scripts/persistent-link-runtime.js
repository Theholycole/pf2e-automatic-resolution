// Conditions and Effects that last as long as the target takes a spell's persistent damage ("until they recover from
// their persistent fire damage", "as long as the target is taking persistent damage from this spell"). They carry no
// timer; the active GM removes them once the creature has no persistent-damage condition of that type left.
const MODULE_ID = "pf2e-automatic-resolution";

/** The persistent damage type an applied Effect is linked to, or null. */
export function persistentLinkType(effect) {
    const flags = effect?.flags?.[MODULE_ID];
    return flags?.outcomeEffect?.persistentLink?.damageType ?? flags?.runtime?.persistentLink?.damageType ?? null;
}

/** Whether the creature is taking persistent damage of this type. */
export function hasPersistentDamage(actor, damageType) {
    return [...(actor?.itemTypes?.condition ?? [])].some(condition => condition.slug === "persistent-damage"
        && condition.system?.persistent?.damageType === damageType);
}

function isLeadGM() {
    const gms = game.users.filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id));
    return gms[0]?.id === game.user.id;
}

/** The creature whose persistent damage a linked Effect follows: its own, or the one the link names (a secondary target's primary). */
function linkedActorUuid(effect) {
    const flags = effect?.flags?.[MODULE_ID];
    return flags?.outcomeEffect?.persistentLink?.actorUuid ?? flags?.runtime?.persistentLink?.actorUuid ?? null;
}

/** Removes the linked Effects whose persistent damage has ended: the creature's own, and others' that follow this creature. */
export async function reconcilePersistentLinks(actor) {
    if (!actor || !isLeadGM()) return [];
    const names = [];
    const own = [...(actor.itemTypes?.effect ?? [])].filter(effect => {
        const type = persistentLinkType(effect);
        if (!type) return false;
        const followed = linkedActorUuid(effect);
        const bearer = followed ? globalThis.fromUuidSync?.(followed) : actor;
        return !bearer || !hasPersistentDamage(bearer, type);
    });
    if (own.length) {
        await actor.deleteEmbeddedDocuments("Item", own.map(effect => effect.id), { [MODULE_ID]: { reason: "persistent-damage-ended" } });
        names.push(...own.map(effect => effect.name));
    }
    const actors = new Set([...game.actors, ...(game.scenes?.contents ?? []).flatMap(scene => scene.tokens.contents.map(token => token.actor))].filter(Boolean));
    for (const other of actors) {
        if (other === actor) continue;
        const ended = [...(other.itemTypes?.effect ?? [])].filter(effect => linkedActorUuid(effect) === actor.uuid && !hasPersistentDamage(actor, persistentLinkType(effect)));
        if (!ended.length) continue;
        await other.deleteEmbeddedDocuments("Item", ended.map(effect => effect.id), { [MODULE_ID]: { reason: "persistent-damage-ended" } }).catch(() => null);
        names.push(...ended.map(effect => effect.name));
    }
    return names;
}

/** The condition a spell's persistent damage ends with ("If the target recovers from being Sickened, the persistent damage ends"). */
export function persistentEndsWithCondition(condition) {
    return condition?.flags?.[MODULE_ID]?.persistentEndsWith?.condition ?? null;
}

/** Removes the creature's persistent damage whose linked condition is gone. */
export async function reconcileConditionEndedPersistent(actor) {
    if (!actor || !isLeadGM()) return [];
    const held = new Set([...(actor.itemTypes?.condition ?? [])].map(condition => condition.slug));
    const ended = [...(actor.itemTypes?.condition ?? [])].filter(condition => condition.slug === "persistent-damage"
        && persistentEndsWithCondition(condition) && !held.has(persistentEndsWithCondition(condition)));
    if (!ended.length) return [];
    await actor.deleteEmbeddedDocuments("Item", ended.map(condition => condition.id), { [MODULE_ID]: { reason: "linked-condition-ended" } });
    return ended.map(condition => condition.name);
}

/** Removes module Effects that end with another Effect ("While a creature is stuck to …": the caster's note ends with its Off-Guard). */
export async function endLinkedEffects(deleted) {
    if (deleted?.type !== "effect" || !deleted.uuid || !isLeadGM()) return [];
    const actors = new Set([...game.actors, ...(game.scenes?.contents ?? []).flatMap(scene => scene.tokens.contents.map(token => token.actor))].filter(Boolean));
    const ended = [];
    for (const actor of actors) {
        // (And persistent damage held by the Effect: Ravaging End's.)
        const linked = [...(actor.itemTypes?.effect ?? []), ...(actor.itemTypes?.condition ?? [])].filter(item => item.flags?.[MODULE_ID]?.runtime?.endsWithEffectUuid === deleted.uuid
            || (item.type === "condition" && item.flags?.[MODULE_ID]?.endsWithEffectUuid === deleted.uuid));
        if (!linked.length) continue;
        await actor.deleteEmbeddedDocuments("Item", linked.map(effect => effect.id), { [MODULE_ID]: { reason: "linked-effect-ended" } }).catch(() => null);
        ended.push(...linked.map(effect => effect.name));
    }
    return ended;
}

export function registerPersistentLinks() {
    Hooks.on("deleteItem", item => {
        if (item?.type === "effect") endLinkedEffects(item).catch(error => console.error(`${MODULE_ID} | Linked Effects could not be removed.`, error));
        if (item?.type !== "condition" || !item.actor) return;
        if (item.slug === "persistent-damage") reconcilePersistentLinks(item.actor).catch(error => console.error(`${MODULE_ID} | Persistent-linked Effects could not be removed.`, error));
        else reconcileConditionEndedPersistent(item.actor).catch(error => console.error(`${MODULE_ID} | Condition-linked persistent damage could not be removed.`, error));
    });
    // Recovery while no GM was connected: check every creature once the world is ready.
    Hooks.once("ready", () => {
        if (!isLeadGM()) return;
        const actors = new Set([...game.actors, ...(game.scenes?.contents ?? []).flatMap(scene => scene.tokens.contents.map(token => token.actor))].filter(Boolean));
        for (const actor of actors) {
            if ([...(actor.itemTypes?.effect ?? [])].some(persistentLinkType))
                reconcilePersistentLinks(actor).catch(error => console.error(`${MODULE_ID} | Persistent-linked Effects could not be reconciled.`, error));
            if ([...(actor.itemTypes?.condition ?? [])].some(persistentEndsWithCondition))
                reconcileConditionEndedPersistent(actor).catch(error => console.error(`${MODULE_ID} | Condition-linked persistent damage could not be reconciled.`, error));
        }
    });
}
