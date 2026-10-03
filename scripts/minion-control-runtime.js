// The caster's control of a creature for as long as a note lasts (Shadow Zombie; user decision 2026-10-01): the caster's owners get OWNER
// on the creature (its linked actor, or the token's synthetic one) and it gains the minion trait; both are restored when the note ends.
const MODULE_ID = "pf2e-automatic-resolution";

/** Grants the control and records what to restore on the note. */
export async function grantMinionControl(note, actor, casterUuid) {
    const caster = casterUuid ? await fromUuid(casterUuid) : null;
    if (!caster) throw new Error("The caster is unavailable for the minion's control.");
    const owners = game.users.filter(user => !user.isGM && caster.testUserPermission?.(user, "OWNER"));
    const before = { ownership: foundry.utils.deepClone(actor.ownership ?? {}), traits: [...(actor.system?.traits?.value ?? [])] };
    const ownership = { ...before.ownership };
    for (const user of owners) ownership[user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    const traits = before.traits.includes("minion") ? before.traits : [...before.traits, "minion"];
    await note.setFlag(MODULE_ID, "minionControl", { actorUuid: actor.uuid, before, granted: owners.map(user => user.id) });
    await actor.update({ ownership, "system.traits.value": traits });
    return { owners: owners.map(user => user.name), traits };
}

/** The note ended: the creature's ownership and traits as they were. */
export async function minionControlOnEnd(item) {
    const control = item?.flags?.[MODULE_ID]?.minionControl;
    if (!control?.actorUuid || !game.user.isGM || game.users.activeGM?.id !== game.user.id) return;
    const actor = await fromUuid(control.actorUuid);
    if (!actor) return;
    // A user who had no level of its own goes back to inheriting the default.
    const ownership = Object.fromEntries((control.granted ?? []).map(id => [id, control.before?.ownership?.[id] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT]));
    if (Object.keys(ownership).length) await actor.update({ ownership });
    await actor.update({ "system.traits.value": control.before?.traits ?? (actor.system?.traits?.value ?? []).filter(trait => trait !== "minion") });
}
