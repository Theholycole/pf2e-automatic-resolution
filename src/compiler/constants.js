export const ABILITY_MODEL_VERSION = 12;
export const COMPILER_VERSION = "0.15.1";

export const DEGREES = Object.freeze([
    "criticalSuccess",
    "success",
    "failure",
    "criticalFailure"
]);

export const AUTOMATION_LEVELS = Object.freeze([
    "automatic",
    "prompted",
    "guided",
    "unsafe",
    "unsupported"
]);

export const BASIC_SAVE_MULTIPLIERS = Object.freeze({
    criticalSuccess: 0,
    success: 0.5,
    failure: 1,
    criticalFailure: 2
});
