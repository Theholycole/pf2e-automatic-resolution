// Pure checks for Strike spells carried by caster Effects (see src/compiler/strike-effects.js).

/** A plan the Strike-effects runtime can resolve: one or two resolved PF2e Effects with a phase each. */
export function isExecutableStrikeEffectsPlan(plan) {
    const resolution = plan?.resolution;
    if (resolution?.kind !== "strike-effects" || !["automatic", "prompted"].includes(plan.automation?.level)) return false;
    const applications = resolution.applications ?? [];
    const effects = plan.nativeEffects?.onUse ?? [];
    return typeof resolution.strike?.sourceText === "string" && applications.length >= 1 && applications.length <= 2
        && applications.every(application => application.kind === "native-spell-effect" && ["before", "after"].includes(application.phase)
            && typeof application.removeAfterStrike === "boolean" && (application.phase === "before" || !application.removeAfterStrike)
            && effects.filter(effect => effect.uuid === application.uuid && effect.resolutionStatus === "resolved" && effect.recipient?.actor === "source").length === 1)
        && (applications.length === 1 ? applications[0].phase === "before" && !applications[0].removeAfterStrike
            : applications.filter(application => application.phase === "after").length === 1
                && applications.filter(application => application.phase === "before" && application.removeAfterStrike).length === 1);
}
