import { AUTOMATION_LEVELS, DEGREES } from "./constants.js";
import { NATIVE_SPELL_EFFECT_UUID_PREFIX } from "./native-spell-effect-compiler.js";
import { DISMISS_ACTION_UUID } from "./effect-termination-compiler.js";
import { inspectCompiledNativeOutcomeEffect } from "../../scripts/native-outcome-effects.js";
import { inspectGeneratedSpeedProof } from '../../scripts/generated-outcome-modifier.js';

const VALID_MULTIPLIERS = new Set([0, 0.5, 1, 2]);
const VALID_OUTCOME_DAMAGE_MODES = new Set(["none", "shared", "formulas", "mixed"]);
const VALID_DURATION_MODES = new Set([
    "instantaneous",
    "outcome",
    "fixed",
    "sustained",
    "turn-boundary",
    "daily-preparations",
    "unlimited",
    "choice",
    "text"
]);
const VALID_NATIVE_EFFECT_RECIPIENTS = new Set(["source", "target", "manual", "rank-dependent", "area-allies"]);
const VALID_CONCRETE_RECIPIENTS = new Set(["source", "target"]);

function validRankRange(range) {
    return Number.isInteger(range?.minRank)
        && range.minRank > 0
        && (range.maxRank === null
            || (Number.isInteger(range.maxRank) && range.maxRank >= range.minRank));
}

function validateRankPartition(branches, baseRank, path, add) {
    if (!Array.isArray(branches) || branches.length === 0) {
        add("RANK_PARTITION_REQUIRED", "A rank partition requires at least one branch.", path);
        return;
    }
    for (const [index, branch] of branches.entries()) {
        const branchPath = `${path}.${index}`;
        if (!validRankRange(branch)) {
            add("RANK_PARTITION_BRANCH_INVALID", "Each rank branch requires a valid minimum and maximum.", branchPath);
        }
        if (index === 0 && branch.minRank !== baseRank) {
            add("RANK_PARTITION_NOT_EXHAUSTIVE", "The first rank branch must begin at the ability's base rank.", `${branchPath}.minRank`);
        }
        const previous = branches[index - 1];
        if (previous && (previous.maxRank === null || previous.maxRank + 1 !== branch.minRank)) {
            add("RANK_PARTITION_DISCONTIGUOUS", "Rank branches must be ordered, exclusive, and contiguous.", branchPath);
        }
        if (index === branches.length - 1 && branch.maxRank !== null) {
            add("RANK_PARTITION_NOT_EXHAUSTIVE", "The final rank branch must have no upper limit.", `${branchPath}.maxRank`);
        }
    }
}

function validateNativeEffect(effect, path, add) {
    if (!String(effect?.uuid ?? "").startsWith(NATIVE_SPELL_EFFECT_UUID_PREFIX)) {
        add("NATIVE_SPELL_EFFECT_UUID_INVALID", "A native spell effect must preserve a pf2e.spell-effects UUID.", `${path}.uuid`);
    }
    if (!VALID_NATIVE_EFFECT_RECIPIENTS.has(effect?.recipient?.actor)) {
        add("NATIVE_SPELL_EFFECT_RECIPIENT_INVALID", "A native spell effect requires a source, target, manual, or rank-dependent recipient.", `${path}.recipient.actor`);
    }
    if (effect?.recipient?.actor === "rank-dependent") {
        const branches = effect.recipient.branches;
        if (effect.recipient.selector !== "cast-rank" || !Array.isArray(branches) || branches.length < 2) {
            add("NATIVE_SPELL_EFFECT_RANK_RECIPIENT_INVALID", "A rank-dependent recipient requires cast-rank branches.", `${path}.recipient`);
        }
        for (const [index, branch] of (branches ?? []).entries()) {
            if (!VALID_CONCRETE_RECIPIENTS.has(branch.actor) || !validRankRange(branch)) {
                add("NATIVE_SPELL_EFFECT_RANK_RECIPIENT_BRANCH_INVALID", "Each recipient branch requires a concrete actor and valid rank range.", `${path}.recipient.branches.${index}`);
            }
        }
    }
    if (effect?.applicationRequiresConfirmation !== true) {
        add("NATIVE_SPELL_EFFECT_CONFIRMATION_REQUIRED", "Native spell-effect application must preserve the confirmation window.", `${path}.applicationRequiresConfirmation`);
    }
    if (effect?.resolutionStatus === "unresolved") {
        add("NATIVE_SPELL_EFFECT_UNRESOLVED", "The native spell effect did not resolve in the supplied catalog.", `${path}.uuid`);
    }
    if (effect?.outcomeRule) {
        const rule = effect.outcomeRule;
        if (!['success', 'failure', 'criticalFailure', ...(['persistent-linked-effect', 'degree-choice', 'option-speed-effect'].includes(rule.kind) ? ['criticalSuccess'] : [])].includes(rule.degree)
            || effect.degrees?.length !== 1 || effect.degrees[0] !== rule.degree
            || !inspectCompiledNativeOutcomeEffect(effect, {degree: rule.degree}).supported) {
            add('NATIVE_OUTCOME_RULE_INVALID', 'A native outcome Effect needs an exact target and a proof (degree Speed penalty, text modifiers, or persistent link).', `${path}.outcomeRule`);
        }
    }
}

export function validateAbilityPlan(plan) {
    const errors = [];
    const add = (code, message, path) => errors.push({ severity: "error", code, message, path });

    if (!plan || typeof plan !== "object") {
        add("PLAN_REQUIRED", "The compiler did not return an ability plan.", "$");
        return errors;
    }
    if (!Number.isInteger(plan.modelVersion) || plan.modelVersion < 1) {
        add("MODEL_VERSION_INVALID", "modelVersion must be a positive integer.", "$.modelVersion");
    }
    if (!plan.source?.name || !plan.source?.itemType) {
        add("SOURCE_INVALID", "The source requires a name and item type.", "$.source");
    }
    if (!AUTOMATION_LEVELS.includes(plan.automation?.level)) {
        add("AUTOMATION_LEVEL_INVALID", "The automation level is not recognized.", "$.automation.level");
    }
    if (!Array.isArray(plan.diagnostics)) {
        add("DIAGNOSTICS_INVALID", "diagnostics must be an array.", "$.diagnostics");
    }
    if (!VALID_DURATION_MODES.has(plan.lifecycle?.durationSpec?.mode)) {
        add("ITEM_DURATION_INVALID", "A spell plan requires a recognized duration mode or an explicit text fallback.", "$.lifecycle.durationSpec.mode");
    }
    const actorConstraints = plan.targeting?.actorConstraints;
    if (!actorConstraints || typeof actorConstraints.supportsActorTargets !== "boolean"
        || typeof actorConstraints.complete !== "boolean" || !Array.isArray(actorConstraints.predicates)) {
        add("ACTOR_TARGET_CONSTRAINTS_INVALID", "Targeting requires a normalized Actor eligibility contract.", "$.targeting.actorConstraints");
    } else {
        for (const [index, predicate] of actorConstraints.predicates.entries()) {
            const valid = predicate?.kind === "living-creature" || predicate?.kind === "hp-zero"
                || (predicate?.kind === "not-immune-damage" && /^[a-z]+$/.test(predicate.damageType ?? ""))
                || predicate?.kind === "undead-or-void-healing"
                || predicate?.kind === "not-undead-or-void-healing"
                || predicate?.kind === "enemy-of-caster"
                || predicate?.kind === "non-ally-of-caster"
                || predicate?.kind === "not-familiar"
                || predicate?.kind === "land-speed-above-caster"
                || (predicate?.kind === "size-at-most" && ["tiny", "sm", "med", "lg", "huge"].includes(predicate.size)
                    && Object.entries(predicate.byRank ?? {}).every(([rank, size]) => /^\d+$/.test(rank) && ["tiny", "sm", "med", "lg", "huge"].includes(size)))
                || (predicate?.kind === "trait" && typeof predicate.present === "boolean" && !!predicate.slug)
                || predicate?.kind === "not-caster"
                || predicate?.kind === "living-or-undead"
                || (predicate?.kind === "persistent-damage" && /^[a-z]+$/.test(predicate.damageType ?? ""))
                || (predicate?.kind === "condition" && /^[a-z-]+$/.test(predicate.slug ?? ""))
                || (predicate?.kind === "gm-confirmed" && typeof predicate.question === "string" && predicate.question.length > 0);
            if (!valid) add("ACTOR_TARGET_PREDICATE_INVALID", "The Actor target predicate is not recognized.", `$.targeting.actorConstraints.predicates.${index}`);
        }
    }

    if (plan.resolution?.kind === "save") {
        if (!plan.resolution.check?.statistic) {
            add("SAVE_STATISTIC_REQUIRED", "A save resolution requires a statistic.", "$.resolution.check.statistic");
        }
        for (const degree of DEGREES) {
            const outcome = plan.resolution.outcomes?.[degree];
            if (!outcome) {
                add("OUTCOME_REQUIRED", `Missing ${degree} outcome.`, `$.resolution.outcomes.${degree}`);
                continue;
            }
            if (outcome.damage?.mode === "shared" && !VALID_MULTIPLIERS.has(outcome.damage.multiplier)) {
                add("DAMAGE_MULTIPLIER_INVALID", `Invalid basic-save multiplier for ${degree}.`, `$.resolution.outcomes.${degree}.damage.multiplier`);
            }
            const componentOverrides = outcome.damage?.componentMultipliers;
            if (componentOverrides) {
                const selected = new Set(outcome.damage.sourceComponentIds ?? []);
                if (outcome.damage.mode !== 'shared' || Array.isArray(componentOverrides)
                    || typeof componentOverrides !== 'object'
                    || Object.entries(componentOverrides).some(([id, multiplier]) =>
                        !selected.has(id) || ![0.5, 1, 2].includes(multiplier))) {
                    add('COMPONENT_MULTIPLIERS_INVALID', 'Component multiplier overrides must name selected components with supported values.', `$.resolution.outcomes.${degree}.damage.componentMultipliers`);
                }
            }
            if (!VALID_OUTCOME_DAMAGE_MODES.has(outcome.damage?.mode)) {
                add("OUTCOME_DAMAGE_MODE_INVALID", `Invalid outcome damage mode for ${degree}.`, `$.resolution.outcomes.${degree}.damage.mode`);
            }
            if (outcome.damage?.mode === "mixed"
                && !VALID_MULTIPLIERS.has(outcome.damage.shared?.multiplier)) {
                add("MIXED_DAMAGE_MULTIPLIER_INVALID", `Invalid mixed shared-damage multiplier for ${degree}.`, `$.resolution.outcomes.${degree}.damage.shared.multiplier`);
            }
            if (["formulas", "mixed"].includes(outcome.damage?.mode)) {
                const combined = outcome.damage.rollScope === 'combined'
                    && plan.compilerEvidence?.inlinePersistentDamage?.kind === 'inline-persistent-plus-structured';
                if ((!combined && outcome.damage.rollScope !== "outcome") || !Array.isArray(outcome.damage.formulas)
                    || outcome.damage.formulas.length === 0) {
                    add("OUTCOME_DAMAGE_FORMULAS_REQUIRED", `Outcome-specific damage for ${degree} requires one or more outcome-scoped formulas.`, `$.resolution.outcomes.${degree}.damage`);
                }
                for (const [index, formula] of (outcome.damage.formulas ?? []).entries()) {
                    if (!formula?.formula || !formula?.source) {
                        add("OUTCOME_DAMAGE_FORMULA_INVALID", "An outcome damage expression requires its formula and source.", `$.resolution.outcomes.${degree}.damage.formulas.${index}`);
                    }
                    if (formula?.heightening && (formula.heightening.type !== "interval"
                        || !Number.isInteger(formula.heightening.interval)
                        || formula.heightening.interval < 1
                        || !formula.heightening.formula)) {
                        add("OUTCOME_DAMAGE_HEIGHTENING_INVALID", "Outcome damage heightening requires a positive interval and increment formula.", `$.resolution.outcomes.${degree}.damage.formulas.${index}.heightening`);
                    }
                }
            }
            for (const [index, followUp] of (outcome.followUps ?? []).entries()) {
                if (followUp.kind !== "save") continue;
                if (!followUp.check?.statistic) {
                    add("SECONDARY_SAVE_STATISTIC_REQUIRED", "A secondary save requires a statistic.", `$.resolution.outcomes.${degree}.followUps.${index}.check.statistic`);
                }
                if (!followUp.outcomes || typeof followUp.outcomes !== "object") {
                    add("SECONDARY_SAVE_OUTCOMES_REQUIRED", "A secondary save requires outcome branches.", `$.resolution.outcomes.${degree}.followUps.${index}.outcomes`);
                }
                if (followUp.decisionWindows?.beforeRoll !== true || followUp.decisionWindows?.applicationRequiresConfirmation !== true) {
                    add("SECONDARY_SAVE_DECISION_WINDOWS_REQUIRED", "A secondary save must preserve pre-roll and pre-application decisions.", `$.resolution.outcomes.${degree}.followUps.${index}.decisionWindows`);
                }
            }
            for (const [index, effect] of (outcome.effects ?? []).entries()) {
                if (effect.whileCondition && effect.whileCondition === effect.slug) {
                    add("LINKED_CONDITION_SELF_REFERENCE", "A linked condition cannot depend on itself.", `$.resolution.outcomes.${degree}.effects.${index}.whileCondition`);
                }
            }
        }
        const componentProof = plan.compilerEvidence?.componentSelectiveDamage;
        const componentCount = componentProof?.kind === 'attack-component-rows' ? plan.resolution.sharedDamage?.components?.length ?? 0
            : componentProof?.kind === 'persistent-only-degree-rows' ? 1 : 2;
        const loneEntry = ['attack-component-rows', 'persistent-only-degree-rows'].includes(componentProof?.kind) && plan.resolution.sharedDamage?.components?.[0]?.category === 'persistent';
        if (componentProof && (!['two-component-initial-persistent', 'attack-component-rows', 'persistent-only-degree-rows'].includes(componentProof.kind)
            || !Array.isArray(componentProof.componentIds) || componentProof.componentIds.length !== componentCount
            // An attack's lone entry is read as a list only when it's persistent.
            || componentCount < (loneEntry ? 1 : 2)
            || new Set(componentProof.componentIds).size !== componentCount
            || componentProof.componentIds.some(id => !plan.resolution.sharedDamage?.components?.some(component => component.id === id))
            || DEGREES.some(degree => {
                // A mixed row (shared damage plus an inline roll) selects entries within its shared part.
                const shared = damage => damage?.mode === 'mixed' ? damage.shared : damage;
                if (componentProof.byDegree?.[degree]?.mode !== plan.resolution.outcomes[degree]?.damage?.mode) return true;
                const claimed = shared(componentProof.byDegree?.[degree]);
                const actual = shared(plan.resolution.outcomes[degree]?.damage);
                const sameOverrides = Object.entries(claimed?.componentMultipliers ?? {}).length
                    === Object.entries(actual?.componentMultipliers ?? {}).length
                    && Object.entries(claimed?.componentMultipliers ?? {}).every(([id, value]) =>
                        actual?.componentMultipliers?.[id] === value);
                return componentProof.sourceText?.[degree] !== plan.resolution.outcomes[degree]?.rawText
                    || claimed?.mode !== actual?.mode || claimed?.multiplier !== actual?.multiplier
                    || !Array.isArray(claimed?.sourceComponentIds)
                    || claimed.sourceComponentIds.length !== actual?.sourceComponentIds?.length
                    || claimed.sourceComponentIds.some((id, index) => id !== actual.sourceComponentIds[index])
                    || !sameOverrides;
            }))) {
            add('COMPONENT_SELECTION_PROOF_INVALID', 'Component selection requires exact degree text and structured component IDs.', '$.compilerEvidence.componentSelectiveDamage');
        }
        const inlineProof = plan.compilerEvidence?.inlinePersistentDamage;
        if (inlineProof && (inlineProof.kind !== 'inline-persistent-plus-structured'
            || inlineProof.persistentType !== 'bleed'
            || !Array.isArray(inlineProof.directComponentIds)
            || ![1, 2].includes(inlineProof.directComponentIds.length)
            || new Set(inlineProof.directComponentIds).size !== inlineProof.directComponentIds.length
            || JSON.stringify(inlineProof.directComponents) !== JSON.stringify(
                plan.resolution.sharedDamage?.components?.map(component =>
                    ({id: component.id, formula: component.formula, type: component.type})))
            || inlineProof.directComponentIds.some(id => !plan.resolution.sharedDamage?.components?.some(component =>
                component.id === id && component.category == null && component.kinds?.length === 1
                && component.kinds[0] === 'damage'))
            || !/^\((?:@item\.(?:rank|level)|[1-9]\d*\*ceil\(@item\.(?:rank|level)\/[1-9]\d*\)-\d+)\)\[bleed\]$/i.test(inlineProof.sourceFormula)
            || DEGREES.some(degree => inlineProof.sourceText?.[degree] !== plan.resolution.outcomes[degree]?.rawText
                || JSON.stringify(inlineProof.byDegree?.[degree]) !== JSON.stringify(plan.resolution.outcomes[degree]?.damage)))) {
            add('INLINE_PERSISTENT_PROOF_INVALID', 'Inline persistent damage requires exact source, component, and degree proof.', '$.compilerEvidence.inlinePersistentDamage');
        }
        const speedProof = inspectGeneratedSpeedProof(plan.compilerEvidence?.generatedSpeedPenalties,
            plan.resolution.outcomes,{lifecycle:plan.lifecycle});
        if (!speedProof.supported) {
            add('GENERATED_SPEED_PROOF_INVALID', speedProof.reason, '$.compilerEvidence.generatedSpeedPenalties');
        }
    }

    if (plan.resolution?.kind === "effect") {
        if (plan.resolution.check !== null || plan.resolution.sharedDamage !== null) {
            add("DIRECT_EFFECT_RESOLUTION_SHAPE_INVALID", "A direct-effect resolution cannot contain a check or shared damage.", "$.resolution");
        }
        if (!Array.isArray(plan.resolution.applications) || plan.resolution.applications.length !== 1) {
            add("DIRECT_EFFECT_APPLICATION_REQUIRED", "A direct-effect resolution requires exactly one application.", "$.resolution.applications");
        }
        const applicationUuid = plan.resolution.applications?.[0]?.uuid;
        if (!plan.nativeEffects?.onUse?.some(effect => effect.uuid === applicationUuid)) {
            add("DIRECT_EFFECT_APPLICATION_MISMATCH", "The direct-effect application must reference an on-use native Effect.", "$.resolution.applications.0.uuid");
        }
        const terminationId = plan.resolution.applications?.[0]?.terminationId;
        if (terminationId && !plan.nativeEffects?.terminations?.some(termination => termination.id === terminationId)) {
            add("DIRECT_EFFECT_TERMINATION_MISMATCH", "The application termination must reference a compiled transition.", "$.resolution.applications.0.terminationId");
        }
    }

    if (plan.resolution?.kind === "effect-sequence") {
        if (plan.resolution.check !== null || plan.resolution.sharedDamage !== null) {
            add("EFFECT_SEQUENCE_RESOLUTION_SHAPE_INVALID", "An effect sequence cannot contain a check or shared damage.", "$.resolution");
        }
        if (!Array.isArray(plan.resolution.applications) || plan.resolution.applications.length !== 2) {
            add("EFFECT_SEQUENCE_APPLICATIONS_REQUIRED", "An effect sequence requires primary and deferred applications.", "$.resolution.applications");
        }
        if (!plan.nativeEffects?.sequences?.some(sequence => sequence.id === plan.resolution.sequenceId)) {
            add("EFFECT_SEQUENCE_REFERENCE_INVALID", "The resolution must reference a compiled native Effect sequence.", "$.resolution.sequenceId");
        }
        const expectedUuids = new Set([
            plan.nativeEffects?.onUse?.[0]?.uuid,
            plan.nativeEffects?.deferred?.[0]?.uuid
        ].filter(Boolean));
        const applicationUuids = new Set((plan.resolution.applications ?? []).map(application => application.uuid));
        if (expectedUuids.size !== applicationUuids.size
            || [...expectedUuids].some(uuid => !applicationUuids.has(uuid))) {
            add("EFFECT_SEQUENCE_APPLICATION_MISMATCH", "Sequence applications must reference the compiled primary and deferred Effects.", "$.resolution.applications");
        }
    }

    if (plan.resolution?.kind === "effect-variant") {
        if (plan.resolution.check !== null || plan.resolution.sharedDamage !== null) {
            add("EFFECT_VARIANT_RESOLUTION_SHAPE_INVALID", "An effect variant cannot contain a check or shared damage.", "$.resolution");
        }
        const selector = plan.resolution.selector;
        if (!selector || selector.selector !== "cast-rank" || selector.exclusive !== true || selector.exhaustive !== true) {
            add("EFFECT_VARIANT_SELECTOR_REQUIRED", "An effect variant requires an exclusive, exhaustive cast-rank selector.", "$.resolution.selector");
        }
        if (!plan.nativeEffects?.variantSelectors?.some(candidate => candidate.id === selector?.id)) {
            add("EFFECT_VARIANT_SELECTOR_MISMATCH", "The resolution selector must reference a compiled native Effect selector.", "$.resolution.selector.id");
        }
        const branches = selector?.branches ?? [];
        if (branches.length < 2) {
            add("EFFECT_VARIANT_BRANCHES_REQUIRED", "An effect variant requires at least two rank branches.", "$.resolution.selector.branches");
        }
        validateRankPartition(branches, plan.rank, "$.resolution.selector.branches", add);
        for (const [index, branch] of branches.entries()) {
            if (!branch.effectUuid) add("EFFECT_VARIANT_UUID_REQUIRED", "Each selector branch requires an Effect UUID.", `$.resolution.selector.branches.${index}.effectUuid`);
        }
        const applications = plan.resolution.applications ?? [];
        if (applications.length !== branches.length
            || branches.some(branch => !applications.some(application =>
                application.uuid === branch.effectUuid
                && application.rankRange?.minRank === branch.minRank
                && application.rankRange?.maxRank === branch.maxRank))) {
            add("EFFECT_VARIANT_APPLICATION_MISMATCH", "Variant applications must match every selector branch exactly.", "$.resolution.applications");
        }
    }

    if (plan.resolution?.kind === "effect-choice") {
        if (plan.resolution.check !== null || plan.resolution.sharedDamage !== null) {
            add("EFFECT_CHOICE_RESOLUTION_SHAPE_INVALID", "An effect choice cannot contain a check or shared damage.", "$.resolution");
        }
        const selector = plan.resolution.selector;
        if (!selector || selector.selector !== "explicit-choice" || selector.prompt !== "select-one"
            || selector.required !== true || selector.exclusive !== true
            || selector.applicationRequiresConfirmation !== true) {
            add("EFFECT_CHOICE_SELECTOR_REQUIRED", "An effect choice requires one exclusive, confirmed player selection.", "$.resolution.selector");
        }
        if (!plan.nativeEffects?.choiceSelectors?.some(candidate => candidate.id === selector?.id)) {
            add("EFFECT_CHOICE_SELECTOR_MISMATCH", "The resolution selector must reference a compiled choice selector.", "$.resolution.selector.id");
        }
        const branches = selector?.branches ?? [];
        const choiceIds = branches.map(branch => branch.choiceId);
        if (branches.length < 2 || choiceIds.some(id => !id) || new Set(choiceIds).size !== choiceIds.length
            || branches.some(branch => !branch.effectUuid || !branch.label)) {
            add("EFFECT_CHOICE_BRANCHES_INVALID", "Choice branches require unique IDs, labels, and Effect UUIDs.", "$.resolution.selector.branches");
        }
        const applications = plan.resolution.applications ?? [];
        if (applications.length !== branches.length
            || branches.some(branch => !applications.some(application =>
                application.uuid === branch.effectUuid && application.choiceId === branch.choiceId))) {
            add("EFFECT_CHOICE_APPLICATION_MISMATCH", "Choice applications must match every selector branch exactly.", "$.resolution.applications");
        }
    }

    for (const degree of DEGREES) {
        for (const [index, effect] of (plan.resolution?.outcomes?.[degree]?.nativeEffects ?? []).entries()) {
            validateNativeEffect(effect, `$.resolution.outcomes.${degree}.nativeEffects.${index}`, add);
        }
    }

    for (const [index, effect] of (plan.nativeEffects?.unscoped ?? []).entries()) {
        validateNativeEffect(effect, `$.nativeEffects.unscoped.${index}`, add);
    }
    for (const [index, effect] of (plan.nativeEffects?.onUse ?? []).entries()) {
        validateNativeEffect(effect, `$.nativeEffects.onUse.${index}`, add);
        if (effect.scope !== "on-use" || effect.trigger?.event !== "use" || effect.trigger?.once !== true) {
            add("NATIVE_SPELL_EFFECT_TRIGGER_INVALID", "An on-use native effect requires a one-time use trigger.", `$.nativeEffects.onUse.${index}.trigger`);
        }
    }
    for (const [index, effect] of (plan.nativeEffects?.deferred ?? []).entries()) {
        validateNativeEffect(effect, `$.nativeEffects.deferred.${index}`, add);
        const trigger = effect.trigger ?? {};
        if (effect.scope !== "deferred" || !["effect-ended", "action-used"].includes(trigger.event)) {
            add("DEFERRED_NATIVE_EFFECT_TRIGGER_INVALID", "A deferred native Effect requires a supported transition trigger.", `$.nativeEffects.deferred.${index}.trigger`);
        }
        if (!plan.nativeEffects?.onUse?.some(primary => primary.uuid === trigger.sourceEffectUuid)) {
            add("DEFERRED_NATIVE_EFFECT_SOURCE_INVALID", "A deferred native Effect must reference its on-use source Effect.", `$.nativeEffects.deferred.${index}.trigger.sourceEffectUuid`);
        }
        if (trigger.event === "effect-ended" && !Array.isArray(trigger.reasons)) {
            add("DEFERRED_NATIVE_EFFECT_REASONS_REQUIRED", "An effect-ended transition requires explicit end reasons.", `$.nativeEffects.deferred.${index}.trigger.reasons`);
        }
        if (trigger.event === "action-used" && !trigger.actionUuid) {
            add("DEFERRED_NATIVE_EFFECT_ACTION_REQUIRED", "An action-used transition requires the triggering action UUID.", `$.nativeEffects.deferred.${index}.trigger.actionUuid`);
        }
    }
    for (const [index, sequence] of (plan.nativeEffects?.sequences ?? []).entries()) {
        if (!plan.nativeEffects?.onUse?.some(effect => effect.uuid === sequence.primaryEffectUuid)
            || !plan.nativeEffects?.deferred?.some(effect => effect.uuid === sequence.successorEffectUuid)) {
            add("NATIVE_EFFECT_SEQUENCE_LINK_INVALID", "A native Effect sequence must link existing on-use and deferred Effects.", `$.nativeEffects.sequences.${index}`);
        }
        if (sequence.reapplication?.blockedWhileSuccessorActive !== true
            || sequence.reapplication?.blockerEffectUuid !== sequence.successorEffectUuid
            || sequence.reapplication?.recipient !== "sequence-recipient") {
            add("NATIVE_EFFECT_SEQUENCE_REAPPLICATION_INVALID", "An immunity sequence must block its primary while the successor is active on the same recipient.", `$.nativeEffects.sequences.${index}.reapplication`);
        }
    }
    for (const [index, effect] of (plan.nativeEffects?.rankVariants ?? []).entries()) {
        validateNativeEffect(effect, `$.nativeEffects.rankVariants.${index}`, add);
        if (effect.scope !== "rank-variant" || effect.trigger?.event !== "use" || effect.trigger?.once !== true
            || !effect.selectorId || !validRankRange(effect.rankRange)) {
            add("NATIVE_EFFECT_RANK_VARIANT_INVALID", "A rank variant requires a selector, a valid rank range, and a one-time use trigger.", `$.nativeEffects.rankVariants.${index}`);
        }
        if (!plan.nativeEffects?.variantSelectors?.some(selector => selector.id === effect.selectorId
            && selector.branches?.some(branch => branch.effectUuid === effect.uuid
                && branch.minRank === effect.rankRange?.minRank
                && branch.maxRank === effect.rankRange?.maxRank))) {
            add("NATIVE_EFFECT_RANK_VARIANT_LINK_INVALID", "A rank variant must match one branch of its selector.", `$.nativeEffects.rankVariants.${index}`);
        }
    }
    for (const [index, selector] of (plan.nativeEffects?.variantSelectors ?? []).entries()) {
        const selectorPath = `$.nativeEffects.variantSelectors.${index}`;
        if (selector.selector !== "cast-rank" || selector.exclusive !== true || selector.exhaustive !== true) {
            add("NATIVE_EFFECT_VARIANT_SELECTOR_INVALID", "A native Effect variant selector must be exclusive, exhaustive, and based on cast rank.", selectorPath);
        }
        validateRankPartition(selector.branches, plan.rank, `${selectorPath}.branches`, add);
        validateRankPartition(selector.recipientBranches, plan.rank, `${selectorPath}.recipientBranches`, add);
        for (const [branchIndex, branch] of (selector.branches ?? []).entries()) {
            if (!branch.effectUuid || !plan.nativeEffects?.rankVariants?.some(effect =>
                effect.uuid === branch.effectUuid
                && effect.selectorId === selector.id
                && effect.rankRange?.minRank === branch.minRank
                && effect.rankRange?.maxRank === branch.maxRank)) {
                add("NATIVE_EFFECT_VARIANT_SELECTOR_LINK_INVALID", "Each selector branch must match one compiled rank-variant Effect.", `${selectorPath}.branches.${branchIndex}`);
            }
        }
        for (const [branchIndex, branch] of (selector.recipientBranches ?? []).entries()) {
            if (!VALID_CONCRETE_RECIPIENTS.has(branch.actor)) {
                add("NATIVE_EFFECT_VARIANT_RECIPIENT_INVALID", "Each recipient branch must resolve to the source or target actor.", `${selectorPath}.recipientBranches.${branchIndex}.actor`);
            }
        }
    }
    for (const [index, effect] of (plan.nativeEffects?.choiceVariants ?? []).entries()) {
        const path = `$.nativeEffects.choiceVariants.${index}`;
        validateNativeEffect(effect, path, add);
        if (effect.scope !== "choice-variant" || effect.trigger?.event !== "use"
            || effect.trigger?.timing !== "after-choice" || effect.trigger?.once !== true
            || !effect.selectorId || !effect.choiceId) {
            add("NATIVE_EFFECT_CHOICE_VARIANT_INVALID", "A choice variant requires a selector choice and one-time post-choice trigger.", path);
        }
        if (!plan.nativeEffects?.choiceSelectors?.some(selector => selector.id === effect.selectorId
            && selector.branches?.some(branch =>
                branch.effectUuid === effect.uuid && branch.choiceId === effect.choiceId))) {
            add("NATIVE_EFFECT_CHOICE_VARIANT_LINK_INVALID", "A choice variant must match one branch of its selector.", path);
        }
    }
    for (const [index, selector] of (plan.nativeEffects?.choiceSelectors ?? []).entries()) {
        const path = `$.nativeEffects.choiceSelectors.${index}`;
        const branches = selector.branches ?? [];
        if (selector.selector !== "explicit-choice" || selector.prompt !== "select-one"
            || selector.timing !== "before-application" || selector.required !== true
            || selector.exclusive !== true || selector.applicationRequiresConfirmation !== true
            || branches.length < 2) {
            add("NATIVE_EFFECT_CHOICE_SELECTOR_INVALID", "A choice selector must require one confirmed selection before application.", path);
        }
        const choiceIds = branches.map(branch => branch.choiceId);
        if (choiceIds.some(id => !id) || new Set(choiceIds).size !== choiceIds.length) {
            add("NATIVE_EFFECT_CHOICE_IDS_INVALID", "Choice selector IDs must be present and unique.", `${path}.branches`);
        }
        for (const [branchIndex, branch] of branches.entries()) {
            if (!branch.label || !branch.effectUuid || !plan.nativeEffects?.choiceVariants?.some(effect =>
                effect.uuid === branch.effectUuid
                && effect.selectorId === selector.id
                && effect.choiceId === branch.choiceId)) {
                add("NATIVE_EFFECT_CHOICE_SELECTOR_LINK_INVALID", "Each choice branch must match one compiled choice-variant Effect.", `${path}.branches.${branchIndex}`);
            }
        }
    }
    const dismissibleEffects = [
        ...(plan.nativeEffects?.onUse ?? []),
        ...(plan.nativeEffects?.rankVariants ?? []),
        ...(plan.nativeEffects?.choiceVariants ?? [])
    ];
    for (const [index, termination] of (plan.nativeEffects?.terminations ?? []).entries()) {
        const path = `$.nativeEffects.terminations.${index}`;
        const sourceEffect = dismissibleEffects.find(effect => effect.uuid === termination.sourceEffectUuid);
        if (!sourceEffect || sourceEffect.terminationId !== termination.id) {
            add("NATIVE_EFFECT_TERMINATION_LINK_INVALID", "A termination must link to an active native Effect application.", path);
        }
        if (termination.event !== "dismissed" || termination.action?.uuid !== DISMISS_ACTION_UUID
            || termination.operation !== "delete-embedded-effect"
            || termination.controller?.kind !== "native-effect-instance"
            || termination.controller?.sourceEffectUuid !== termination.sourceEffectUuid) {
            add("NATIVE_EFFECT_TERMINATION_ACTION_INVALID", "A dismissal transition must use PF2e Dismiss and delete the embedded Effect.", `${path}.action`);
        }
        if (!VALID_CONCRETE_RECIPIENTS.has(termination.authority?.actor)
            || termination.scope !== (termination.authority?.actor === "target" ? "recipient-effect" : "cast-instance")) {
            add("NATIVE_EFFECT_TERMINATION_AUTHORITY_INVALID", "Dismissal authority and removal scope must identify the controlling actor.", `${path}.authority`);
        }
        if (termination.applicationRequiresConfirmation !== true) {
            add("NATIVE_EFFECT_TERMINATION_CONFIRMATION_REQUIRED", "Effect termination requires confirmation before deletion.", `${path}.applicationRequiresConfirmation`);
        }
        const cost = termination.action?.cost;
        if (!((cost?.type === "action" && cost.value === 1)
            || (cost?.type === "free-action" && cost.value === 0 && termination.action?.trigger?.event)
            // "You can Dismiss the spell as a free action.": an untriggered free action, stated in its sentence.
            || (cost?.type === "free-action" && cost.value === 0 && termination.action?.trigger == null && /\bDismiss the spell as a free action\.$/.test(String(termination.sourceText ?? ""))))) {
            add("NATIVE_EFFECT_TERMINATION_COST_INVALID", "Dismiss must be a one-action activity, an explicitly triggered free action, or a stated free action.", `${path}.action.cost`);
        }
        if (!plan.lifecycle?.termination?.transitionIds?.includes(termination.id)) {
            add("LIFECYCLE_TERMINATION_LINK_INVALID", "A native Effect termination must appear in the lifecycle transition list.", path);
        }
    }
    for (const [index, transitionId] of (plan.lifecycle?.termination?.transitionIds ?? []).entries()) {
        if (!plan.nativeEffects?.terminations?.some(termination => termination.id === transitionId)) {
            add("LIFECYCLE_TERMINATION_REFERENCE_INVALID", "A lifecycle termination ID must reference an authoritative native Effect transition.", `$.lifecycle.termination.transitionIds.${index}`);
        }
    }

    if (plan.lifecycle?.controller?.required && !plan.lifecycle.controller.castInstanceKey) {
        add("CONTROLLER_KEY_REQUIRED", "A lifecycle controller requires a cast-instance key.", "$.lifecycle.controller.castInstanceKey");
    }

    return errors;
}
