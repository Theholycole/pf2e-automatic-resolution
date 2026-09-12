export const SAVE_DEGREES = Object.freeze([
    "criticalSuccess",
    "success",
    "failure",
    "criticalFailure"
]);

const VALUED_CONDITIONS = new Set([
    "clumsy", "cursebound", "doomed", "drained", "dying", "enfeebled",
    "frightened", "sickened", "slowed", "stunned", "stupefied", "wounded"
]);

export function normalizeSaveDegree(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === "number") return ["criticalFailure", "failure", "success", "criticalSuccess"][value] ?? null;
    const key = String(value).toLowerCase().replace(/[\s_-]/g, "");
    return {
        criticalfailure: "criticalFailure",
        critfailure: "criticalFailure",
        criticalfail: "criticalFailure",
        failure: "failure",
        fail: "failure",
        success: "success",
        criticalsuccess: "criticalSuccess",
        critsuccess: "criticalSuccess"
    }[key] ?? null;
}

export function readableSaveDegree(degree) {
    return {
        criticalSuccess: "Critical Success",
        success: "Success",
        failure: "Failure",
        criticalFailure: "Critical Failure"
    }[degree] ?? "Not rolled";
}

export function basicSaveMultiplier(degree) {
    return {
        criticalSuccess: 0,
        success: 0.5,
        failure: 1,
        criticalFailure: 2
    }[normalizeSaveDegree(degree)] ?? null;
}

export function checkRollSkipDialog(event, showCheckDialogs = true) {
    const normallySkip = !showCheckDialogs;
    return event?.shiftKey === true ? !normallySkip : normallySkip;
}

function executableActorTargetConstraints(plan) {
    const constraints = plan?.targeting?.actorConstraints;
    return constraints?.supportsActorTargets === true
        && constraints.complete === true
        && Array.isArray(constraints.predicates)
        && constraints.predicates.every(predicate =>
            (predicate.kind === "trait" && predicate.present === true && !!predicate.slug)
            || predicate.kind === "living-creature");
}

function actorTraits(actor) {
    const traits = actor?.traits;
    if (traits && typeof traits.has === "function") return traits;
    return new Set(actor?.system?.traits?.value ?? []);
}

function actorIsCreature(actor) {
    if (typeof actor?.isOfType === "function") return actor.isOfType("creature");
    return ["character", "npc", "familiar"].includes(actor?.type);
}

export function validateActorTarget(constraints, actor) {
    if (!constraints) {
        return { eligible: false, reason: "target eligibility is missing; prepare a new resolution card" };
    }
    if (!constraints?.supportsActorTargets) {
        return { eligible: false, reason: "the ability does not target an Actor" };
    }
    if (!constraints.complete) {
        return { eligible: false, reason: "target eligibility was not completely compiled" };
    }
    const traits = actorTraits(actor);
    for (const predicate of constraints.predicates ?? []) {
        if (predicate.kind === "trait" && predicate.present === true && !traits.has(predicate.slug)) {
            return { eligible: false, reason: `requires the ${predicate.slug} trait` };
        }
        if (predicate.kind === "living-creature"
            && (!actorIsCreature(actor) || traits.has("undead") || traits.has("construct"))) {
            return { eligible: false, reason: "requires a living creature" };
        }
    }
    return { eligible: true, reason: null };
}

export function isExecutableBasicSavePlan(plan) {
    if (plan?.resolution?.kind !== "save" || plan.automation?.level !== "automatic") return false;
    if (!executableActorTargetConstraints(plan)) return false;
    if (plan.resolution.check?.basic !== true || !plan.resolution.check?.statistic) return false;
    const shared = plan.resolution.sharedDamage;
    if (shared?.mode !== "pf2e-item-damage" || shared.rollOnce !== true || !shared.components?.length) return false;
    return SAVE_DEGREES.every(degree => {
        const outcome = plan.resolution.outcomes?.[degree];
        const multiplier = basicSaveMultiplier(degree);
        const expectedMode = multiplier === 0 ? "none" : "shared";
        return outcome?.damage?.mode === expectedMode
            && outcome.damage.multiplier === multiplier
            && (outcome.effects?.length ?? 0) === 0
            && (outcome.nativeEffects?.length ?? 0) === 0
            && (outcome.followUps?.length ?? 0) === 0
            && outcome.terminal == null;
    });
}

function isExecutableOutcomeCondition(effect) {
    if (effect?.kind !== "condition" || !effect.slug || effect.whileCondition) return false;
    if (effect.endsWhen != null || ["event", "first"].includes(effect.expirationMode)) return false;
    if (VALUED_CONDITIONS.has(effect.slug)) {
        if (!Number.isInteger(effect.value) || effect.value < 1) return false;
        if (effect.slug === "stunned" && effect.duration == null && effect.value > 3) return false;
    } else if (effect.value != null) return false;
    if (effect.duration == null || effect.duration.mode === "unlimited") return true;
    return effect.duration.mode === "fixed"
        && Number.isFinite(Number(effect.duration.value))
        && Number(effect.duration.value) > 0
        && typeof effect.duration.unit === "string";
}

function sharedDamagePart(damage) {
    if (damage?.mode === "shared") return damage;
    return damage?.mode === "mixed" ? damage.shared : null;
}

function executableFormula(entry) {
    if (!entry || typeof entry.formula !== "string" || !entry.formula.trim()) return false;
    if (![...entry.formula.matchAll(/@([a-z0-9_.-]+)/gi)]
        .every(match => ["item.rank", "item.level"].includes(match[1].toLowerCase()))) return false;
    if (!entry.heightening) return true;
    return entry.heightening.type === "interval"
        && Number.isInteger(entry.heightening.interval)
        && entry.heightening.interval > 0
        && /^\d+d\d+$/i.test(entry.formula.replace(/\[[^\]]+\]\s*$/, ""))
        && /^\d+d\d+$/i.test(entry.heightening.formula);
}

function executableFormulaDamage(damage, rollScope = "outcome") {
    return ["formulas", "mixed"].includes(damage?.mode)
        && damage.rollScope === rollScope
        && Array.isArray(damage.formulas)
        && damage.formulas.length > 0
        && damage.formulas.every(executableFormula);
}

function isExecutableSecondaryOutcome(outcome) {
    if (!outcome || (outcome.manualInstructions?.length ?? 0) > 0
        || (outcome.stateChanges?.length ?? 0) > 0
        || !(outcome.effects ?? []).every(isExecutableOutcomeCondition)) return false;
    if (outcome.terminal != null
        && !(outcome.terminal.kind === "death" && outcome.terminal.automatic === true)) return false;
    const damage = outcome.damage;
    if (damage?.mode === "none") return damage.multiplier === 0;
    if (damage?.mode === "primary-shared") return [0.5, 1, 2].includes(damage.multiplier);
    return executableFormulaDamage(damage, "secondary-outcome");
}

function isExecutableImmediateSecondarySave(followUp) {
    return followUp?.kind === "save"
        && followUp.complete === true
        && followUp.timing?.event === "after-primary-outcome"
        && followUp.timing.recurring === false
        && !!followUp.check?.statistic
        && followUp.decisionWindows?.nativeRollDialog === true
        && followUp.decisionWindows?.provisionalResult === true
        && SAVE_DEGREES.every(degree => isExecutableSecondaryOutcome(followUp.outcomes?.[degree]));
}

export function isExecutableDegreeSavePlan(plan) {
    if (plan?.resolution?.kind !== "save" || !plan.resolution.check?.statistic) return false;
    if (!executableActorTargetConstraints(plan)) return false;
    if (plan.resolution.check.basic === true || plan.automation?.level !== "guided") return false;
    if ((plan.automation.pendingCapabilities?.length ?? 0) > 0
        || (plan.automation.delegatedCapabilities?.length ?? 0) > 0) return false;
    if (!["instantaneous", "fixed"].includes(plan.lifecycle?.durationSpec?.mode)
        || plan.lifecycle?.controller?.required === true) return false;
    if (plan.lifecycle.durationSpec.mode === "fixed"
        && (!Number.isFinite(Number(plan.lifecycle.durationSpec.value))
            || Number(plan.lifecycle.durationSpec.value) <= 0
            || typeof plan.lifecycle.durationSpec.unit !== "string")) return false;
    if (plan.resolution.postDamageTerminal != null) return false;

    const shared = plan.resolution.sharedDamage;
    if (shared && (shared.mode !== "pf2e-item-damage" || shared.rollOnce !== true
        || !shared.components?.length || shared.components.some(component => component.category))) return false;
    const componentIds = new Set((shared?.components ?? []).map(component => component.id));

    return SAVE_DEGREES.every(degree => {
        const outcome = plan.resolution.outcomes?.[degree];
        if (!outcome?.semanticCoverage?.fullyCompiled) return false;
        if ((outcome.nativeEffects?.length ?? 0) > 0
            || (outcome.followUps?.length ?? 0) > 1
            || !(outcome.followUps ?? []).every(isExecutableImmediateSecondarySave)
            || (outcome.decisions?.length ?? 0) > 0
            || (outcome.manualInstructions?.length ?? 0) > 0
            || outcome.terminal != null
            || !(outcome.effects ?? []).every(isExecutableOutcomeCondition)) return false;
        const damage = outcome.damage;
        if (damage?.mode === "none") return damage.multiplier === 0;
        if (!["shared", "formulas", "mixed"].includes(damage?.mode)) return false;
        if (["formulas", "mixed"].includes(damage.mode) && !executableFormulaDamage(damage)) return false;
        const sharedPart = sharedDamagePart(damage);
        if (!sharedPart) return damage.mode === "formulas";
        if (!shared || ![0.5, 1, 2].includes(sharedPart.multiplier)) return false;
        const selectedIds = new Set(sharedPart.sourceComponentIds ?? []);
        return selectedIds.size === componentIds.size
            && [...componentIds].every(id => selectedIds.has(id));
    });
}

export function isExecutableSavePlan(plan) {
    return isExecutableBasicSavePlan(plan) || isExecutableDegreeSavePlan(plan);
}

export function outcomeForTarget(state, target) {
    return state.outcomes?.[target?.degree] ?? null;
}

export function secondarySaveForTarget(state, target) {
    const followUpId = target?.secondary?.followUpId;
    return followUpId
        ? (outcomeForTarget(state, target)?.followUps ?? []).find(followUp => followUp.id === followUpId) ?? null
        : null;
}

export function secondaryOutcomeForTarget(state, target) {
    return secondarySaveForTarget(state, target)?.outcomes?.[target?.secondary?.degree] ?? null;
}

export function damageMultiplierForTarget(state, target) {
    const damage = outcomeForTarget(state, target)?.damage;
    const secondaryDamage = secondaryOutcomeForTarget(state, target)?.damage;
    if (secondaryDamage?.mode === "primary-shared") return Number(secondaryDamage.multiplier ?? 0);
    if (state.outcomes) {
        return damage?.mode === "mixed"
            ? Number(damage.shared?.multiplier ?? 0)
            : damage?.mode === "shared" ? Number(damage.multiplier ?? 0) : 0;
    }
    return basicSaveMultiplier(target?.degree);
}

export function outcomeDamageRollIds(state, target) {
    return [
        ...(outcomeForTarget(state, target)?.damage?.formulas ?? []),
        ...(secondaryOutcomeForTarget(state, target)?.damage?.formulas ?? [])
    ]
        .map(entry => entry.rollId)
        .filter(Boolean);
}

export function requiredOutcomeDamageRolls(state) {
    const ids = new Set((state.targets ?? []).filter(target => target.eligible !== false)
        .flatMap(target => outcomeDamageRollIds(state, target)));
    return (state.damage?.outcomeRolls ?? []).filter(entry => ids.has(entry.id));
}

export function sharedDamageRequired(state) {
    if (state.damage?.enabled === false) return false;
    if (!state.outcomes) return true;
    return (state.targets ?? []).filter(target => target.eligible !== false).some(target => {
        const secondaryDamage = secondaryOutcomeForTarget(state, target)?.damage;
        if (secondaryDamage?.mode === "primary-shared" && Number(secondaryDamage.multiplier) > 0) return true;
        const damage = outcomeForTarget(state, target)?.damage;
        const shared = sharedDamagePart(damage);
        return Number(shared?.multiplier) > 0;
    });
}

export function recordProvisionalSave(state, targetId, result) {
    const target = state.targets?.find(candidate => candidate.id === targetId);
    if (!target) throw new Error("The saving-throw target is not part of this cast.");
    const degree = normalizeSaveDegree(result.degree);
    if (!degree) throw new Error("The saving throw has no recognized degree of success.");
    if (target.applicationStatus === "applied" || target.applicationStatus === "applying") {
        target.postApplicationDegree = degree;
        target.postApplicationMessageId = result.messageId ?? null;
        target.reviewRequired = true;
        state.reviewRequired = true;
        state.reviewReason = `${target.name} rolled again after result application.`;
        return { status: "manual-review", target };
    }
    if (Number(result.timestamp ?? 0) < Number(target.saveTimestamp ?? 0)) {
        return { status: "stale", target };
    }
    target.degree = degree;
    target.saveMessageId = result.messageId ?? null;
    target.saveTimestamp = Number(result.timestamp ?? Date.now());
    target.rollRevision = Number(target.rollRevision ?? 0) + 1;
    target.reroll = result.reroll === true || target.rollRevision > 1;
    target.saveTotal = Number.isFinite(Number(result.total)) ? Number(result.total) : null;
    target.saveNatural = Number.isFinite(Number(result.natural)) ? Number(result.natural) : null;
    target.saveModifier = Number.isFinite(Number(result.modifier)) ? Number(result.modifier) : null;
    target.lastSubmissionId = result.submissionId ?? null;
    return { status: "recorded", target };
}

export function recordSecondarySave(state, targetId, result) {
    const target = state.targets?.find(candidate => candidate.id === targetId);
    const secondary = target?.secondary;
    if (!target || !secondary) throw new Error("The target has no pending secondary saving throw.");
    const degree = normalizeSaveDegree(result.degree);
    if (!degree) throw new Error("The secondary saving throw has no recognized degree of success.");
    if (target.applicationStatus === "applied" || target.applicationStatus === "applying") {
        secondary.postApplicationDegree = degree;
        secondary.reviewRequired = true;
        target.reviewRequired = true;
        state.reviewRequired = true;
        state.reviewReason = `${target.name} rolled its secondary save again after result application.`;
        return { status: "manual-review", target, secondary };
    }
    secondary.degree = degree;
    secondary.rollRevision = Number(secondary.rollRevision ?? 0) + 1;
    secondary.reroll = result.reroll === true || secondary.rollRevision > 1;
    secondary.saveTotal = Number.isFinite(Number(result.total)) ? Number(result.total) : null;
    secondary.saveNatural = Number.isFinite(Number(result.natural)) ? Number(result.natural) : null;
    secondary.saveModifier = Number.isFinite(Number(result.modifier)) ? Number(result.modifier) : null;
    secondary.lastSubmissionId = result.submissionId ?? null;
    return { status: "recorded", target, secondary };
}

export function saveCollectionReadiness(state) {
    if (state.status === "completed") return { ready: false, reason: "Resolution is already complete." };
    if (state.reviewRequired) return { ready: false, reason: state.reviewReason ?? "Manual review is required." };
    const missing = (state.targets ?? []).filter(target => target.eligible !== false && !target.degree);
    if (missing.length) return { ready: false, reason: `${missing.length} saving throw${missing.length === 1 ? " is" : "s are"} still required.` };
    const missingSecondary = (state.targets ?? []).filter(target =>
        target.eligible !== false && target.secondary && !target.secondary.degree);
    if (missingSecondary.length) {
        return {
            ready: false,
            reason: `${missingSecondary.length} secondary saving throw${missingSecondary.length === 1 ? " is" : "s are"} still required.`
        };
    }
    if ((state.targets ?? []).some(target => target.applicationStatus === "applying")) {
        return { ready: false, reason: "An interrupted result application requires manual review." };
    }
    return { ready: true, reason: null };
}

export function basicSaveReadiness(state) {
    const collection = saveCollectionReadiness(state);
    if (!collection.ready) return collection;
    if (sharedDamageRequired(state) && !state.damage?.rollJSON) {
        return { ready: false, reason: "Roll shared damage first." };
    }
    const missingOutcomeRolls = requiredOutcomeDamageRolls(state).filter(entry => !entry.rollJSON);
    if (missingOutcomeRolls.length) {
        return {
            ready: false,
            reason: `Roll ${missingOutcomeRolls.length} required outcome damage formula${missingOutcomeRolls.length === 1 ? "" : "s"} first.`
        };
    }
    return { ready: true, reason: null };
}
