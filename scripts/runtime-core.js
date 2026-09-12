export const SUPPORTED_RESOLUTION_KINDS = Object.freeze([
    "effect",
    "effect-variant",
    "effect-choice",
    "effect-sequence"
]);

function inRankRange(branch, castRank) {
    return castRank >= branch.minRank
        && (branch.maxRank === null || castRank <= branch.maxRank);
}

export function selectRankBranch(selector, castRank) {
    const rank = Number(castRank);
    if (!Number.isInteger(rank) || rank < 1) {
        throw new Error("A positive integer cast rank is required.");
    }
    const matches = (selector?.branches ?? []).filter(branch => inRankRange(branch, rank));
    if (matches.length !== 1) {
        throw new Error(`Cast rank ${rank} matched ${matches.length} Effect branches; expected exactly one.`);
    }
    return matches[0];
}

export function selectChoiceBranch(selector, choiceId) {
    if (!choiceId) throw new Error("An Effect choice is required.");
    const matches = (selector?.branches ?? []).filter(branch => branch.choiceId === choiceId);
    if (matches.length !== 1) {
        throw new Error(`Choice ${JSON.stringify(choiceId)} matched ${matches.length} Effect branches; expected exactly one.`);
    }
    return matches[0];
}

export function selectApplications(plan, { castRank = null, choiceId = null } = {}) {
    const resolution = plan?.resolution;
    if (!SUPPORTED_RESOLUTION_KINDS.includes(resolution?.kind)) {
        throw new Error(`Resolution kind ${JSON.stringify(resolution?.kind)} is not executable by this runtime.`);
    }

    if (resolution.kind === "effect") return [resolution.applications[0]];
    if (resolution.kind === "effect-sequence") return [resolution.applications[0]];
    if (resolution.kind === "effect-variant") {
        const branch = selectRankBranch(resolution.selector, castRank);
        return [resolution.applications.find(application => application.uuid === branch.effectUuid
            && application.rankRange?.minRank === branch.minRank
            && application.rankRange?.maxRank === branch.maxRank)];
    }
    const branch = selectChoiceBranch(resolution.selector, choiceId);
    return [resolution.applications.find(application =>
        application.uuid === branch.effectUuid && application.choiceId === branch.choiceId)];
}

export function effectForApplication(plan, application) {
    if (!application) throw new Error("The selected application is missing from the compiled plan.");
    const collection = {
        "nativeEffects.onUse": plan.nativeEffects?.onUse,
        "nativeEffects.rankVariants": plan.nativeEffects?.rankVariants,
        "nativeEffects.choiceVariants": plan.nativeEffects?.choiceVariants
    }[application.source] ?? [];
    const matches = collection.filter(effect => effect.uuid === application.uuid
        && (!application.choiceId || effect.choiceId === application.choiceId)
        && (!application.rankRange
            || (effect.rankRange?.minRank === application.rankRange.minRank
                && effect.rankRange?.maxRank === application.rankRange.maxRank)));
    if (matches.length !== 1) {
        throw new Error(`Application ${application.uuid} matched ${matches.length} native Effect specifications; expected exactly one.`);
    }
    return matches[0];
}

export function recipientActorType(effect, castRank) {
    if (effect?.recipient?.actor !== "rank-dependent") return effect?.recipient?.actor ?? null;
    return selectRankBranch({ branches: effect.recipient.branches }, castRank).actor;
}
