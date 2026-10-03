// Set aside an Effect or affliction for a while, then put it back: a counteract that suspends an affliction for 1 hour
// (Delay Affliction) or suppresses an effect until the start of the caster's next turn (Sound Body). PF2e has no way
// to switch an Effect off, so the module keeps its source on a marker Effect (with that duration) and removes it; when
// the marker's time is up (or the GM deletes the marker) the source is recreated. Its start moves forward by the time
// it was set aside, so its own duration doesn't elapse meanwhile.
import { nativeConditionTiming } from "./condition-timing.js";

const MODULE_ID = "pf2e-automatic-resolution";
const RESTORING = new Set();

function isLeadGM() {
    const gms = game.users.filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id));
    return gms[0]?.id === game.user.id;
}

/** The marker's PF2e duration: a fixed time, or until the start of the caster's next turn. */
export function setAsideDuration(setAside, casterUuid, targetUuid, combat = globalThis.game?.combat) {
    // A fixed time (a suspension, or a suppression "for the duration" of the spell).
    if (setAside.duration) return { value: setAside.duration.value, unit: setAside.duration.unit, expiry: setAside.duration.unit === "rounds" ? "turn-start" : null };
    const cast = { started: combat?.started === true, turn: combat?.turn ?? 0, turnActors: (combat?.turns ?? []).map(turn => turn.actor?.uuid ?? null) };
    const timing = nativeConditionTiming({ mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "source-turn", offset: 1 }, cast, casterUuid, targetUuid);
    return { value: timing.value, unit: "rounds", expiry: "turn-start" };
}

/** Remove `document` from its actor and keep it on a marker until the set-aside ends. Returns the marker. */
export async function setAsideEffect(document, { setAside, spellName, casterActor, castRank }) {
    const actor = document.actor;
    const source = document.toObject();
    const duration = setAsideDuration(setAside, casterActor.uuid, actor.uuid);
    const initiative = game.combat?.started ? game.combat.combatants.find(combatant => combatant.actor?.uuid === casterActor.uuid)?.initiative ?? null : null;
    const [marker] = await actor.createEmbeddedDocuments("Item", [{
        name: `${spellName}: ${document.name} ${setAside.mode === "suspend" ? "suspended" : "suppressed"}`, type: "effect", img: "icons/svg/sleep.svg",
        flags: { [MODULE_ID]: { setAside: { source, mode: setAside.mode, startedAt: game.time.worldTime } } },
        system: {
            level: { value: castRank }, duration: { ...duration, sustained: false },
            start: { value: game.time.worldTime, initiative },
            context: { origin: { actor: casterActor.uuid, item: null }, target: { actor: actor.uuid }, roll: null },
            description: { value: `<p><strong>${foundry.utils.escapeHTML(document.name)}</strong> is ${setAside.mode === "suspend" ? "suspended" : "suppressed"} by ${foundry.utils.escapeHTML(spellName)}. It returns when this ends (its own duration doesn't elapse meanwhile).</p>` },
            rules: []
        }
    }]);
    await document.delete({ [MODULE_ID]: { reason: "set-aside" } });
    return marker;
}

/**
 * Put the set-aside document back (its start moved forward by the time it was away) and remove the marker. The marker
 * is removed first: PF2e's own sweep may be removing an expired marker at the same moment, so "already gone" is fine,
 * and the delete hook leaves a marker this call is restoring alone.
 */
export async function restoreSetAside(marker, { markerDeleted = false } = {}) {
    const data = marker?.flags?.[MODULE_ID]?.setAside;
    if (!data || RESTORING.has(marker.uuid)) return null;
    RESTORING.add(marker.uuid);
    try {
        const actor = marker.parent ?? marker.actor;
        if (!markerDeleted && actor.items.has(marker.id)) {
            try { await marker.delete({ [MODULE_ID]: { reason: "set-aside-restored" } }); } catch { /* removed meanwhile (PF2e expiry) */ }
        }
        const source = foundry.utils.deepClone(data.source);
        const away = Math.max(0, game.time.worldTime - Number(data.startedAt ?? game.time.worldTime));
        if (source.system?.start && Number.isFinite(Number(source.system.start.value))) source.system.start.value = Number(source.system.start.value) + away;
        const [restored] = await actor.createEmbeddedDocuments("Item", [source], { keepId: !actor.items.has(source._id) });
        return restored;
    } finally { RESTORING.delete(marker.uuid); }
}

/** The lead GM restores every expired marker on these actors. */
export async function reconcileSetAside(actors) {
    if (!isLeadGM()) return [];
    const restored = [];
    for (const actor of actors) for (const marker of [...(actor?.itemTypes?.effect ?? [])].filter(effect => effect.flags?.[MODULE_ID]?.setAside && effect.isExpired)) {
        restored.push(await restoreSetAside(marker));
    }
    return restored.filter(Boolean);
}

function sceneActors() {
    return new Set([...game.actors, ...(game.scenes?.contents ?? []).flatMap(scene => scene.tokens.contents.map(token => token.actor))].filter(Boolean));
}

export function registerSetAside() {
    const check = () => reconcileSetAside(sceneActors()).catch(error => console.error(`${MODULE_ID} | Set-aside Effects could not be restored.`, error));
    Hooks.on("updateWorldTime", check);
    Hooks.on("updateCombat", check);
    Hooks.once("ready", check);
    // The GM deleting a marker ends the set-aside early.
    Hooks.on("deleteItem", (item, options) => {
        if (!item.flags?.[MODULE_ID]?.setAside || options?.[MODULE_ID]?.reason === "set-aside-restored" || !isLeadGM()) return;
        restoreSetAside(item, { markerDeleted: true }).catch(error => console.error(`${MODULE_ID} | A set-aside Effect could not be restored.`, error));
    });
}
