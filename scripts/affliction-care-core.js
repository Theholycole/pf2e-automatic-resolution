import { isExecutableBasicSavePlan } from "./basic-save-core.js";
import { UNITS } from "./runtime-utils.js";

// Pure rules for affliction care: plan validation, rank application and
// PF2e affliction-save arithmetic. No Foundry globals.

const OPS = new Set(["suppress-condition", "decrease-conditions", "affliction-saves", "affliction-save", "reduce-affliction-stage", "reduce-conditions", "persistent-damage", "counteract", "damage", "heal", "lose-hp", "ward"]);
// What a counteract can pick: effects by trait or granted condition, afflictions (Pseudo Afflictions) by trait, the
// affliction chosen for the spell's other operation, or any spell effect (and, with otherTargets, an area or item).
// "triggering-spell": the spell a reaction answers; "other": an item or ward the GM names.
const COUNTERACT_SOURCES = new Set(["effect", "affliction", "chosen-affliction", "spell-effect", "triggering-spell", "other"]);
const TRAIT = /^[a-z-]+$/;
const duration = d => d && Number.isInteger(d.value) && d.value > 0 && UNITS.has(d.unit);
const SECONDS = { rounds: 6, minutes: 60, hours: 3600, days: 86400 };

function validOperation(op) {
    if (!OPS.has(op?.op)) return false;
    switch (op.op) {
        // The chosen condition set aside for the spell's duration (Word of Freedom).
        case "suppress-condition": return Array.isArray(op.from) && op.from.length > 0 && op.from.every(slug => TRAIT.test(slug)) && op.setAside?.mode === "suppress" && duration(op.setAside.duration);
        case "decrease-conditions": return Array.isArray(op.slugs) && op.slugs.length > 0 && Number.isInteger(op.by) && op.by > 0;
        case "affliction-saves": return op.each === true && duration(op.maxStageLength) && op.modifier === 0;
        case "affliction-save": return op.pick === 1 && Array.isArray(op.traits) && Array.isArray(op.modifierChoice) && op.modifierChoice.length === 2 && op.modifierType === "status";
        case "reduce-affliction-stage": return op.pick === 1 && Array.isArray(op.traits) && Number.isInteger(op.by) && op.by > 0 && op.floor === 1;
        case "reduce-conditions": return Array.isArray(op.from) && op.from.length > 0 && Array.isArray(op.patterns) && op.patterns.every(pattern => Array.isArray(pattern) && pattern.every(value => Number.isInteger(value) && value > 0));
        case "persistent-damage": return op.damageType === "poison" && op.pick === 1 && Array.isArray(op.flatCheckDCChoice) && op.flatCheckDCChoice.length === 2;
        case "counteract": {
            const source = op.source ?? "effect";
            if (!COUNTERACT_SOURCES.has(source) || !(op.pick === "any" || (Number.isInteger(op.pick) && op.pick >= 1)) || !Array.isArray(op.traits) || !Array.isArray(op.grantsConditions)
                || !op.traits.every(trait => TRAIT.test(trait)) || !op.grantsConditions.every(slug => TRAIT.test(slug))) return false;
            if (source === "effect") return op.traits.length + op.grantsConditions.length > 0;
            if (op.optional != null && op.optional !== true) return false;
            // Cleansing Flames: poison afflictions imposing one of the listed conditions count too.
            if (op.afflictionTraits != null && !(source === "effect" && Array.isArray(op.afflictionTraits) && op.afflictionTraits.length && op.afflictionTraits.every(trait => TRAIT.test(trait)) && op.grantsConditions.length)) return false;
            // Suspending instead of removing (Delay Affliction): an affliction, for a fixed time.
            // Suspending an affliction (Delay Affliction) or suppressing an effect for the spell's duration (Unblinking Flame Revelation).
            if (op.setAside != null && !(((source === "affliction" && op.setAside.mode === "suspend") || (source === "effect" && op.setAside.mode === "suppress")) && duration(op.setAside.duration))) return false;
            if (op.secret != null && op.secret !== true) return false;
            // Thief of Fortune: a spell effect copied to the caster (both halved), no longer than the stated duration.
            if (op.siphon != null && !(op.siphon === true && source === "spell-effect" && op.otherTargets == null && Number.isInteger(op.maxSeconds) && op.maxSeconds > 0)) return false;
            if (op.maxSeconds != null && op.siphon !== true) return false;
            if (op.anyAffliction != null && !(op.anyAffliction === true && source === "affliction" && op.traits.length === 0)) return false;
            if (source === "affliction" || source === "chosen-affliction") return (op.traits.length > 0 || op.anyAffliction === true) && op.grantsConditions.length === 0;
            if ((source === "triggering-spell" || source === "other") && op.otherTargets !== true) return false;
            if (op.automatic != null && !(op.automatic === true && source === "triggering-spell")) return false;
            // Elemental Counter: the counteract rank is the rank of the spell slot lost.
            if (op.rankFromLostSlot != null && !(op.rankFromLostSlot === true && source === "triggering-spell")) return false;
            return op.traits.length === 0 && op.grantsConditions.length === 0;
        }
        case "damage": return TRAIT.test(op.damageType ?? "") && op.amount === "rank";
        case "heal": return /^\d+(?:d\d+)?(?:\+\d+)?$/.test(op.formula ?? "");
        case "ward": return Object.keys(op).length === 1;
        case "lose-hp": return op.recipient === "caster" && op.per === "triggering-rank" && Number.isInteger(op.dice) && op.dice > 0 && Number.isInteger(op.faces) && op.faces > 1;
    }
    return false;
}

export function isExecutableCarePlan(plan) {
    const r = plan?.resolution;
    if (r?.kind !== "affliction-care" || plan.automation?.pendingCapabilities?.length) return false;
    const modes = r.modes ?? [];
    if (!modes.every(mode => typeof mode.id === "string" && mode.operations?.length && mode.operations.every(validOperation))) return false;
    if (!(r.operations ?? []).every(validOperation)) return false;
    if (!modes.length && !(r.operations ?? []).length) return false;
    if (r.immunity != null && !duration(r.immunity)) return false;
    if (r.dailyLimit != null && !duration(r.dailyLimit)) return false;
    if (r.unwillingSave != null && !(["fortitude", "reflex", "will"].includes(r.unwillingSave.statistic) && r.unwillingSave.negates === true)) return false;
    if (r.counteractFailure != null && !(Number.isInteger(r.counteractFailure.bonus) && r.counteractFailure.type === "status" && duration(r.counteractFailure.duration))) return false;
    if (!["target", "targets", "self", "counteract-target", "triggering-spell", undefined].includes(r.recipient)) return false;
    // Several targets ("you and up to 9 allies"): list options only, each applied to every target.
    if (r.recipient === "targets" && !(Number.isInteger(r.maxTargets) && r.maxTargets > 1 && r.includesCaster === true && modes.length && !(r.operations ?? []).length)) return false;
    if (r.recipient !== "targets" && (r.maxTargets != null || r.includesCaster != null)) return false;
    const ops = [...(r.operations ?? []), ...modes.flatMap(mode => mode.operations)];
    // A counteract against "the target" (a spell effect, area or item) is the only thing such a spell does.
    if (r.recipient === "counteract-target" && !(ops.length === 1 && ops[0].op === "counteract" && ops[0].otherTargets === true && ["spell-effect", "other"].includes(ops[0].source)
        && Array.isArray(r.otherKinds) && r.otherKinds.length && r.otherKinds.every(kind => ["spell", "item"].includes(kind)))) return false;
    // A reaction to a spell counteracts that spell; the caster may lose Hit Points for it.
    if (r.recipient === "triggering-spell" && !(ops[0]?.op === "counteract" && ops[0].source === "triggering-spell" && ops.slice(1).every(op => op.op === "lose-hp"))) return false;
    if (ops.some(op => op.otherTargets) && !["counteract-target", "triggering-spell"].includes(r.recipient)) return false;
    if (ops.some(op => op.op === "lose-hp") && r.recipient !== "triggering-spell") return false;
    if (r.counteractOutcome != null && !(typeof r.counteractOutcome === "object" && Object.entries(r.counteractOutcome).every(([key, text]) => ["success", "criticalSuccess", "failure"].includes(key) && typeof text === "string" && text.length > 0))) return false;
    // Sound Body: a near miss suppresses the effect until the start of the caster's next turn, its duration paused.
    if (r.nearMiss != null && !(Number.isInteger(r.nearMiss.ranks) && r.nearMiss.ranks > 0 && r.nearMiss.setAside?.mode === "suppress"
        && r.nearMiss.setAside.until === "caster-next-turn-start" && r.nearMiss.setAside.pauseDuration === true
        && ops.filter(op => op.op === "counteract").length === 1 && ops.some(op => op.op === "counteract" && (op.source ?? "effect") === "effect"))) return false;
    if (r.excludeTraits != null && !(Array.isArray(r.excludeTraits) && r.excludeTraits.every(trait => TRAIT.test(trait)))) return false;
    // "becoming Drained 1 … to grant you a +1 circumstance bonus to your counteract check" (the target's choice).
    if (r.empower != null && !(r.empower.condition === "drained" && Number.isInteger(r.empower.bonus) && r.empower.bonus > 0 && r.empower.type === "circumstance"
        && ops.filter(op => op.op === "counteract").length === 1)) return false;
    for (const key of ["normalStateNote", "awareness"]) if (r[key] != null && typeof r[key] !== "string") return false;
    if (r.counteractPickStep != null && !(r.counteractPickStep.perStep === 1 && Number.isInteger(r.counteractPickStep.interval) && Number.isInteger(r.counteractPickStep.baseRank)
        && ops.some(op => op.setAside))) return false;
    if (r.counteractRankBonus != null && !(Number.isInteger(r.counteractRankBonus) && r.counteractRankBonus > 0)) return false;
    // Elemental Counter: a lost slot of the countering element (the cycle says which).
    const lostSlot = ops.some(op => op.rankFromLostSlot);
    if ((r.costSlot != null || r.elementCycle != null || lostSlot) && !(r.costSlot === true && lostSlot && r.elementCycle && typeof r.elementCycle === "object"
        && Object.entries(r.elementCycle).every(([element, counters]) => TRAIT.test(element) && Array.isArray(counters) && counters.length && counters.every(counter => TRAIT.test(counter))))) return false;
    // Detonate Magic: a success sets off the spell's own basic-save explosion (a compiled plan).
    if ((r.explosion != null || r.explosionPlan != null || r.explosionNote != null) && !(r.explosion && r.recipient === "counteract-target"
        && isExecutableBasicSavePlan(r.explosionPlan) && (r.explosionNote == null || typeof r.explosionNote === "string"))) return false;
    // A standing ward: its trigger, a fixed duration or until the caster's daily preparations, and the ward alone.
    const ward = r.ward;
    if ((ward != null) !== ops.some(op => op.op === "ward")) return false;
    if (ward != null && !(ops.length === 1 && ["target", "self"].includes(r.recipient) && typeof ward.trigger === "string" && ward.trigger.length > 0
        && ((duration(ward.duration) && ward.untilDailyPreparations == null) || (ward.untilDailyPreparations === true && ward.duration == null))
        && [ward.named, ward.reaction, ward.endsAfterUse, ward.secret, ward.seeThrough].every(value => value == null || value === true)
        // Seeing through ends nothing; it's always a secret check.
        && (ward.seeThrough == null || (ward.secret === true && !ward.endsAfterUse))
        // Dispelling Globe: "as if … 1 rank lower".
        && (ward.rankOffset == null || (Number.isInteger(ward.rankOffset) && ward.rankOffset < 0 && ward.rankOffset >= -3))
        && (ward.cantripRank == null || ward.cantripRank === 1) && (ward.successText == null || typeof ward.successText === "string")
        && (ward.notes == null || (Array.isArray(ward.notes) && ward.notes.every(note => typeof note === "string"))))) return false;
    if (r.counteractLimit != null && typeof r.counteractLimit !== "string") return false;
    if (r.castingCondition != null && !(Array.isArray(r.castingCondition) && r.castingCondition.every(text => typeof text === "string"))) return false;
    if (r.restoreSlot != null && !(Number.isInteger(r.restoreSlot) && r.restoreSlot >= 1 && r.restoreSlot <= 10 && r.recipient === "counteract-target")) return false;
    if (r.magicItem != null && !(duration(r.magicItem) && r.recipient === "counteract-target")) return false;
    if (r.artifactFails != null && r.artifactFails !== true) return false;
    if (r.negatedByImmunity != null && !TRAIT.test(r.negatedByImmunity)) return false;
    if (r.chooseAffliction != null && !(Array.isArray(r.chooseAffliction) && r.chooseAffliction.every(trait => TRAIT.test(trait)))) return false;
    for (const change of (r.heightened ?? []).flatMap(entry => entry.changes ?? [])) {
        if (change.counteractChosen && !(r.chooseAffliction && change.counteractChosen.every(trait => r.chooseAffliction.includes(trait)))) return false;
        if (change.counteractAny && !ops.some(op => op.op === "counteract")) return false;
    }
    return true;
}

/** The plan as it applies at a cast rank: heightened entries at or below it. */
export function carePlanAtRank(resolution, castRank) {
    const plan = structuredClone(resolution);
    plan.pickAny = false;
    plan.permanent = {};
    for (const entry of (plan.heightened ?? []).filter(entry => entry.rank <= castRank).sort((a, b) => a.rank - b.rank)) {
        for (const change of entry.changes) {
            if (change.addCondition) for (const mode of plan.modes) for (const op of mode.operations) if (op.op === "reduce-conditions" && op.from.length > 1 && !op.from.includes(change.addCondition)) op.from.push(change.addCondition);
            if (change.lessenBy) for (const mode of plan.modes) for (const op of mode.operations) if (op.op === "reduce-affliction-stage") op.by = change.lessenBy;
            if (change.addMode && !plan.modes.some(mode => mode.id === change.addMode.id)) plan.modes.push(structuredClone(change.addMode));
            if (change.excludePermanent) plan.permanent[change.excludePermanent] = { allowed: false };
            if (change.permitPermanent) plan.permanent[change.permitPermanent] = { allowed: true, cost: change.cost };
            if (change.pickAny) plan.pickAny = true;
            if (change.restoreSlot) plan.restoreSlot = change.restoreSlot;
            if (change.wardDuration && plan.ward) plan.ward.duration = { ...change.wardDuration };
            if (change.wardNote && plan.ward) plan.ward.notes = [...(plan.ward.notes ?? []), change.wardNote];
            if (change.addCounteractConditions) for (const op of plan.operations) if (op.op === "counteract" && (op.source ?? "effect") === "effect")
                op.grantsConditions = [...new Set([...op.grantsConditions, ...change.addCounteractConditions])];
            if (change.counteractAny) for (const op of [...plan.operations, ...plan.modes.flatMap(mode => mode.operations)]) if (op.op === "counteract") op.pick = "any";
            if (change.counteractChosen) {
                // The highest rank's list wins ("if it is a curse, disease, or poison").
                plan.operations = plan.operations.filter(op => op.source !== "chosen-affliction");
                plan.operations.push({ op: "counteract", pick: 1, source: "chosen-affliction", traits: [...change.counteractChosen], grantsConditions: [] });
            }
        }
    }
    // "… and you can attempt to suspend an additional affliction" per heightening step.
    const step = plan.counteractPickStep;
    if (step) for (const op of plan.operations) if (op.op === "counteract" && op.setAside)
        op.pick = 1 + Math.max(0, Math.floor((castRank - step.baseRank) / step.interval)) * step.perStep;
    return plan;
}

/** Stage shown to players (an onset occupies the handler's first badge value). */
export function afflictionStage(badge, onset) {
    return onset ? badge - 1 : badge;
}

/**
 * PF2e affliction save: critical success −2 stages, success −1, failure +1,
 * critical failure +2. A virulent affliction's critical success is −1 and a
 * success doesn't reduce it (two consecutive successes are the GM's to track).
 */
export function afflictionStageDelta(degreeOfSuccess, virulent = false) {
    return virulent ? [2, 1, 0, -1][degreeOfSuccess] : [2, 1, -1, -2][degreeOfSuccess];
}

/** New handler badge for a stage change, or null when the affliction is cured. */
export function nextAfflictionBadge({ badge, max, onset }, delta, floor = null) {
    const stage = afflictionStage(badge, onset);
    let next = stage + delta;
    if (floor != null) next = Math.max(floor, next);
    if (next < 1) return null;
    const maxStage = afflictionStage(max, onset);
    next = Math.min(maxStage, next);
    return onset ? next + 1 : next;
}

export function stageLengthSeconds(stageDuration) {
    if (!stageDuration || !SECONDS[stageDuration.unit]) return Infinity;
    return Number(stageDuration.value) * SECONDS[stageDuration.unit];
}

export function durationSeconds(value) {
    return Number(value.value) * SECONDS[value.unit];
}

/** An affliction's counteract rank: half its level, rounded up. */
export function afflictionCounteractRank(level) {
    return level != null && level !== "" && Number.isFinite(Number(level)) ? Math.max(0, Math.ceil(Number(level) / 2)) : null;
}

/** PF2e counteract: can the effect of counteract rank `targetRank` be countered at this degree? */
export function counteracts(degreeOfSuccess, counteractRank, targetRank) {
    const reach = [null, counteractRank - 1, counteractRank + 1, counteractRank + 3][degreeOfSuccess];
    return reach != null && targetRank <= reach;
}
