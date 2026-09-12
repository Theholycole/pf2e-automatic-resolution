export const BASIC_SAVE_PREPARE_ACTION = "pf2e-auto-prepare-basic-save";

export function claimNativeSpellSaveButton(button) {
    if (!button || button.dataset?.action !== "spell-save") return false;
    button.dataset.action = BASIC_SAVE_PREPARE_ACTION;
    button.classList.add("pf2e-auto-runtime-resolve");
    return true;
}
