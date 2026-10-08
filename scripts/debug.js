import { MODULE_ID } from "./runtime-utils.js";

const DEBUG_SETTING = "debugLogging";

export function registerDebugSetting() {
    game.settings.register(MODULE_ID, DEBUG_SETTING, {
        name: "Debug Logging",
        hint: "Write detailed cast, target, save, damage, and Effect diagnostics to the browser console.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: enabled => console.info(`PF2e Automatic Resolution | Debug logging ${enabled ? "enabled" : "disabled"}.`)
    });
}

export function debugEnabled() {
    try { return game.settings?.get(MODULE_ID, DEBUG_SETTING) === true; }
    catch (_) { return false; }
}

export function debugLog(castId, event, details = {}) {
    if (!debugEnabled()) return;
    const label = `[PF2e Automatic Resolution][${castId ?? "runtime"}] ${event}`;
    console.groupCollapsed(label);
    console.debug({ castId: castId ?? null, event, timestamp: Date.now(), ...details });
    console.groupEnd();
}

export function debugError(castId, event, error, details = {}) {
    if (!debugEnabled()) return;
    const label = `[PF2e Automatic Resolution][${castId ?? "runtime"}] ${event}`;
    console.group(label);
    console.error(error, { castId: castId ?? null, event, timestamp: Date.now(), ...details });
    console.groupEnd();
}

function resolveCard(cardOrId) {
    if (typeof cardOrId === "string") return game.messages.get(cardOrId) ?? null;
    return cardOrId ?? null;
}

export function debugCast(cardOrId) {
    const card = resolveCard(cardOrId);
    const state = card?.getFlag?.(MODULE_ID, "basicSaveState")
        ?? card?.flags?.[MODULE_ID]?.basicSaveState
        ?? null;
    if (!state) throw new Error("No save-resolution state was found on that chat message.");
    const snapshot = foundry.utils.deepClone(state);
    console.group(`PF2e Automatic Resolution | ${state.spellName} | ${state.castId}`);
    console.log("Chat message", card);
    console.log("Persisted save state", snapshot);
    console.table(snapshot.targets.map(target => ({
        name: target.name,
        actorUuid: target.actorUuid,
        tokenUuid: target.tokenUuid,
        degree: target.degree,
        status: target.applicationStatus,
        hpBefore: target.hpBefore,
        hpAfter: target.hpAfter,
        effects: target.effectUuids?.length ?? 0
    })));
    console.groupEnd();
    return snapshot;
}

export function debugLatestCast() {
    const messages = game.messages?.contents ?? [...(game.messages ?? [])];
    const card = [...messages].reverse().find(message =>
        message.getFlag?.(MODULE_ID, "basicSaveState")
        ?? message.flags?.[MODULE_ID]?.basicSaveState);
    if (!card) throw new Error("No save-resolution card was found in chat history.");
    return debugCast(card);
}
