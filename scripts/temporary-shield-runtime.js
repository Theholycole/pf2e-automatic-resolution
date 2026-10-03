// A temporary PF2e shield item from a spell (Shielded Arm): the Effect holds the duration and the shield item does the blocking. Removing
// either removes the other; the spell ends when the shield's Hit Points above its Broken Threshold are gone (PF2e sets the threshold to half
// the maximum, so the item carries twice the spell's Hit Points).
const MODULE_ID = "pf2e-automatic-resolution";

const link = item => item?.flags?.[MODULE_ID]?.temporaryShield ?? null;

function isLeadGM() {
    return game.user?.isGM && game.users.activeGM?.id === game.user.id;
}

/** The shield item's source for the spell's Hardness and Hit Points (held in one hand, no Bulk or price). */
export function temporaryShieldSource({ name, part, hardness, hp, acBonus, castId, effectId, img, keepOnDestroyed = false }) {
    return { name, type: "shield", img: img ?? "icons/equipment/shield/buckler-wooden-boss-steel.webp",
        flags: { [MODULE_ID]: { temporaryShield: { castId, effectId, spellHp: hp, ...(keepOnDestroyed ? { keepOnDestroyed: true } : {}) } } },
        system: { acBonus, hardness, hp: { value: hp * 2, max: hp * 2 }, equipped: { carryType: "held", handsHeld: 1 }, bulk: { value: 0 }, price: { value: {} },
            description: { value: `<p>The target's ${part}, used as a shield: Hardness ${hardness}, ${hp} Hit Points and no Broken Threshold. PF2e shows twice those Hit Points; the spell's are those above the Broken Threshold, and the spell ends when they're gone.</p>` } } };
}

/** The shield's remaining spell Hit Points. */
export function temporaryShieldRemaining(shield) {
    const data = link(shield);
    return data ? Math.max(0, Number(shield.system?.hp?.value ?? 0) - data.spellHp) : null;
}

async function removeLinked(actor, predicate, reason) {
    const ids = actor.items.filter(item => predicate(item)).map(item => item.id);
    if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids, { [MODULE_ID]: { reason } });
}

export function registerTemporaryShields() {
    Hooks.on("deleteItem", (item, options) => {
        if (!isLeadGM() || !item.actor || options?.[MODULE_ID]?.reason === "temporary-shield-linked") return;
        const data = link(item);
        if (!data) return;
        // A shield the spell recreates (Bone Shield): its loss doesn't end the spell.
        if (item.type === "shield" && data.keepOnDestroyed) return;
        // The Effect ended (duration, End): the shield goes; the shield went: the Effect goes.
        const partner = other => link(other)?.castId === data.castId && other.id !== item.id;
        removeLinked(item.actor, partner, "temporary-shield-linked").catch(error => console.error(`${MODULE_ID} | The spell's shield could not be removed.`, error));
    });
    Hooks.on("updateItem", item => {
        if (!isLeadGM() || !link(item)) return;
        // The Effect expired (PF2e marks it without deleting it): the spell and its shield end.
        if (item.type === "effect" && (item.isExpired || item.system?.expired)) {
            const castId = link(item).castId;
            removeLinked(item.actor, other => link(other)?.castId === castId, "temporary-shield-expired").catch(error => console.error(`${MODULE_ID} | The spell's shield could not be removed.`, error));
            return;
        }
        if (item.type !== "shield" || temporaryShieldRemaining(item) > 0) return;
        // Destroyed but recreated on Sustain: only the shield goes.
        if (link(item).keepOnDestroyed) {
            item.actor.deleteEmbeddedDocuments("Item", [item.id], { [MODULE_ID]: { reason: "temporary-shield-destroyed" } })
                .then(() => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), content: `<p><strong>${foundry.utils.escapeHTML(item.name)}</strong> is destroyed; it's recreated, raised, when you Sustain the spell.</p>` }))
                .catch(error => console.error(`${MODULE_ID} | The destroyed shield could not be removed.`, error));
            return;
        }
        // Its Hit Points are expended: the spell ends.
        const castId = link(item).castId;
        removeLinked(item.actor, other => link(other)?.castId === castId, "temporary-shield-expended")
            .then(() => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: item.actor }), content: `<p><strong>${foundry.utils.escapeHTML(item.name)}</strong>: its Hit Points are expended; the spell ends.</p>` }))
            .catch(error => console.error(`${MODULE_ID} | The expended shield could not be removed.`, error));
    });
}
