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
