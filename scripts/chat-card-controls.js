export const BASIC_SAVE_PREPARE_ACTION = "pf2e-auto-prepare-basic-save";

export function claimNativeSpellSaveButton(button) {
    if (!button || button.dataset?.action !== "spell-save") return false;
    button.dataset.action = BASIC_SAVE_PREPARE_ACTION;
    button.classList.add("pf2e-auto-runtime-resolve");
    return true;
}

const COORDINATED_SAVE_ACTIONS = new Set([
    "correct-target", "cast-choice", "caster-choice", "dice-upgrade", "persistent-rider", "damage-bonus", "cast-gate", "beneficiary-effect", "condition-choice", "roll-all", "add-targets", "finalize", "roll-damage", "roll-outcome-damage", "apply"
]);

export function refreshSaveButtonAuthority(button, canCoordinate) {
    if (!COORDINATED_SAVE_ACTIONS.has(button.dataset.saveAction)) return;
    // Preserve the collector's readiness lock independently of a client's authority.
    button.dataset.saveStateDisabled ??= String(button.disabled);
    button.dataset.saveStateTitle ??= button.title ?? "";
    button.disabled = button.dataset.saveStateDisabled === "true"
        || button.dataset.runtimeBusy === "true" || !canCoordinate;
    button.title = canCoordinate ? button.dataset.saveStateTitle
        : "The active GM coordinates this cast-wide control.";
}

// The save card's buttons by who needs them: the GM sees every one; the caster (an owner of the casting actor) the cast's own — adding
// targets, finalizing (which rolls and applies the damage) and outcome damage rolls; a target's owner that target's save rolls.
export const CASTER_SAVE_ACTIONS = new Set(["add-targets", "finalize", "roll-damage", "roll-outcome-damage"]);
const TARGET_SAVE_ACTIONS = new Set(["roll-save", "hero-reroll"]);

/** "gm", "caster", "target" or "hidden" for this user and button. */
export function saveButtonRole(button, card, user) {
    if (user?.isGM) return "gm";
    const state = card?.getFlag?.("pf2e-automatic-resolution", "basicSaveState");
    if (!state) return "hidden";
    const action = button.dataset.saveAction;
    const owns = uuid => { try { const doc = uuid ? fromUuidSync(uuid) : null; return !!doc?.testUserPermission?.(user, "OWNER"); } catch (_) { return false; } };
    if (CASTER_SAVE_ACTIONS.has(action)) return owns(state.sourceActorUuid) ? "caster" : "hidden";
    if (TARGET_SAVE_ACTIONS.has(action)) {
        const target = (state.targets ?? []).find(entry => entry.id === button.dataset.targetId);
        return target && owns(target.actorUuid) ? "target" : "hidden";
    }
    return "hidden";
}
