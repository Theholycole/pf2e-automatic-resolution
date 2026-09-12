import {
    ABILITY_MODEL_VERSION,
    BASIC_SAVE_MULTIPLIERS,
    COMPILER_VERSION,
    DEGREES
} from "./constants.js";
import { compileChoiceVariantResolution, compileChoiceVariantSelection } from "./choice-variant-compiler.js";
import {
    analyzeDescription,
    extractDurationCandidates,
    extractInlineExpressions,
    extractPersistentDamageExpressions,
    htmlToPlainText,
    inferDamageMultiplier
} from "./description-parser.js";
import { compileDirectEffectResolution } from "./direct-effect-resolution-compiler.js";
import { compileEffectDuration, compileItemDuration } from "./duration-compiler.js";
import { compileEffectTerminations } from "./effect-termination-compiler.js";
import { compileLinkedConditions } from "./linked-condition-compiler.js";
import { compileEffectSequenceResolution, compileMultiEffectSequence } from "./multi-effect-sequence-compiler.js";
import { compileNativeSpellEffects } from "./native-spell-effect-compiler.js";
import { compileRankVariantResolution, compileRankVariantSelection } from "./rank-variant-compiler.js";
import { cloneJSON } from "./normalize.js";
import { classifyManualSemantics, inferPostDamageTerminal, inferTerminalResult } from "./outcome-semantics.js";
import { analyzeResidualProse } from "./residual-prose.js";
import { compileSecondarySave } from "./secondary-save-compiler.js";
import { adaptSpellSource } from "./spell-source-adapter.js";
import { assessSimpleBasicSaveDescription } from "./semantic-gate.js";
import { compileUnscopedEffectTriggers } from "./unscoped-effect-trigger-compiler.js";
import { compileActorTargetConstraints } from "./target-predicate-compiler.js";
import { validateAbilityPlan } from "./validate-plan.js";

function diagnostic(severity, code, message, path = null) {
    return { severity, code, message, ...(path ? { path } : {}) };
}

function emptyOutcome() {
    return {
        damage: { mode: "none", multiplier: 0, sourceComponentIds: [] },
        effects: [],
        nativeEffects: [],
        followUps: [],
        decisions: [],
        manualInstructions: [],
        terminal: null,
        rawText: ""
    };
}

function basicSaveOutcomes(componentIds) {
    return Object.fromEntries(DEGREES.map(degree => {
        const multiplier = BASIC_SAVE_MULTIPLIERS[degree];
        const outcome = emptyOutcome();
        outcome.damage = multiplier === 0
            ? { mode: "none", multiplier: 0, sourceComponentIds: [] }
            : { mode: "shared", multiplier, sourceComponentIds: [...componentIds] };
        return [degree, outcome];
    }));
}

function referencedDegree(text) {
    const match = String(text ?? "").match(/\bAs (critical success|critical failure|success|failure)\b/i);
    if (!match) return null;
    return {
        "critical success": "criticalSuccess",
        "critical failure": "criticalFailure",
        success: "success",
        failure: "failure"
    }[match[1].toLowerCase()] ?? null;
}

function mergeInheritedOutcome(base, own) {
    if (!base) return own;
    return {
        ...cloneJSON(base),
        ...own,
        damage: own.damage.mode === "none" ? cloneJSON(base.damage) : own.damage,
        effects: [...cloneJSON(base.effects), ...own.effects],
        nativeEffects: [...cloneJSON(base.nativeEffects ?? []), ...(own.nativeEffects ?? [])]
            .filter((effect, index, all) => all.findIndex(candidate => candidate.uuid === effect.uuid) === index),
        followUps: [...cloneJSON(base.followUps), ...own.followUps],
        decisions: [...cloneJSON(base.decisions), ...own.decisions],
        manualInstructions: [...cloneJSON(base.manualInstructions), ...own.manualInstructions]
    };
}

function unique(values) {
    return [...new Set(values)];
}

function finalizePlan(plan) {
    plan.automation.compiledCapabilities = unique(plan.automation.compiledCapabilities);
    plan.automation.pendingCapabilities = unique(plan.automation.pendingCapabilities);
    plan.automation.delegatedCapabilities = unique(plan.automation.delegatedCapabilities ?? []);
    return plan;
}

function hasUnscopedConditionDuration(outcomes) {
    return DEGREES.some(degree => {
        const effects = outcomes[degree].effects;
        if (!effects.length) return false;
        const claimedText = new Set(effects.map(effect => effect.duration?.sourceText).filter(Boolean));
        return extractDurationCandidates(outcomes[degree].rawText)
            .some(candidate => !claimedText.has(candidate.duration.sourceText));
    });
}

function addPostDamageTerminalCapability(plan) {
    if (!plan.resolution.postDamageTerminal) return;
    plan.automation.compiledCapabilities.push("post-damage-terminal");
    plan.diagnostics.push(diagnostic(
        "info",
        "POST_DAMAGE_TERMINAL_COMPILED",
        "A source-specific reduced-to-0-HP death result was compiled."
    ));
}

function compileOutcomeDescription(outcome, section, componentIds, lifecycle) {
    const secondarySave = compileSecondarySave(section, { lifecycle });
    const primaryText = secondarySave
        ? section.text.slice(0, secondarySave.sourceRange.start).trim()
        : section.text;
    const inlineDamage = extractInlineExpressions(primaryText, "@Damage[");
    const formulas = [
        ...inlineDamage.map(expression => ({
            formula: normalizeInlineDamageFormula(expression),
            source: "description-inline"
        })),
        ...extractPersistentDamageExpressions(primaryText).map(expression => ({
            formula: expression.formula,
            source: expression.source
        }))
    ];
    const multiplier = inferDamageMultiplier(primaryText);

    if (formulas.length > 0 && componentIds.length > 0 && multiplier > 0) {
        outcome.damage = {
            mode: "mixed",
            shared: { multiplier, sourceComponentIds: [...componentIds] },
            formulas,
            rollScope: "outcome"
        };
    } else if (formulas.length > 0) {
        outcome.damage = {
            mode: "formulas",
            formulas,
            rollScope: "outcome"
        };
    } else if (componentIds.length > 0 && multiplier != null) {
        outcome.damage = multiplier === 0
            ? { mode: "none", multiplier: 0, sourceComponentIds: [] }
            : { mode: "shared", multiplier, sourceComponentIds: [...componentIds] };
    }

    const primaryConditions = (section.conditions ?? []).filter(effect =>
        !secondarySave || effect.index < secondarySave.sourceRange.start
    );
    outcome.effects.push(...compileLinkedConditions(primaryConditions, primaryText)
        .map(effect => compileEffectDuration(effect, primaryText, lifecycle)));
    if (secondarySave) outcome.followUps.push(secondarySave);
    outcome.terminal = inferTerminalResult(primaryText);
    outcome.manualInstructions.push(...classifyManualSemantics(primaryText));
}

function normalizeInlineDamageFormula(expression) {
    const formula = expression.body;
    if (!/\bpersistent\b/i.test(expression.label ?? "") || /\[[^\]]*\bpersistent\b[^\]]*\]\s*$/i.test(formula)) {
        return formula;
    }
    const typed = /^(.*)\[([^\[\]]+)\]\s*$/.exec(formula);
    if (typed) return `${typed[1]}[persistent,${typed[2]}]`;
    const damageType = String(expression.label).match(/\bpersistent\s+([a-z][a-z-]*)\b/i)?.[1];
    return damageType ? `${formula}[persistent,${damageType.toLowerCase()}]` : formula;
}

function attachOutcomeFormulaHeightening(outcomes, adapted) {
    const interval = Number(adapted.heightening?.interval);
    if (adapted.heightening?.type !== "interval" || !Number.isInteger(interval) || interval < 1) return;
    const text = htmlToPlainText(adapted.descriptionHTML);
    const increases = [...text.matchAll(/\bpersistent\s+([a-z][a-z-]*)\s+damage\b[^.]*?\bincreases by\s+(\d+d\d+)\b/gi)]
        .map(match => ({ type: match[1].toLowerCase(), formula: match[2] }));
    for (const outcome of Object.values(outcomes)) {
        for (const entry of outcome.damage?.formulas ?? []) {
            const types = String(entry.formula).match(/\[([^\]]+)\]\s*$/)?.[1]
                ?.split(",").map(value => value.trim().toLowerCase()) ?? [];
            const increase = increases.find(candidate => types.includes("persistent") && types.includes(candidate.type));
            if (increase) entry.heightening = { type: "interval", interval, formula: increase.formula };
        }
    }
}

function addResidualProseAnalysis(plan) {
    const byOutcome = {};
    for (const degree of DEGREES) {
        const outcome = plan.resolution.outcomes[degree];
        outcome.semanticCoverage = analyzeResidualProse(outcome);
        byOutcome[degree] = outcome.semanticCoverage;
    }

    const residualClauseCount = Object.values(byOutcome)
        .reduce((total, coverage) => total + coverage.residualClauseCount, 0);
    const guidedClauseCount = Object.values(byOutcome)
        .reduce((total, coverage) => total + coverage.guidedClauseCount, 0);
    plan.compilerEvidence.residualProse = {
        complete: residualClauseCount === 0,
        residualClauseCount,
        guidedClauseCount
    };
    plan.automation.compiledCapabilities.push("residual-prose-analysis");

    if (residualClauseCount > 0) {
        plan.automation.pendingCapabilities.push("residual-prose");
        plan.diagnostics.push(diagnostic(
            "warning",
            "RESIDUAL_PROSE_PENDING",
            `${residualClauseCount} outcome clause${residualClauseCount === 1 ? "" : "s"} remain unclaimed after semantic analysis.`
        ));
    } else {
        plan.automation.compiledCapabilities.push("outcome-prose-accounted");
        plan.diagnostics.push(diagnostic(
            "info",
            "OUTCOME_PROSE_ACCOUNTED",
            "Every bounded outcome clause is either compiled or explicitly classified for guided resolution."
        ));
    }
}

function addOutcomeExtensionCapabilities(plan) {
    const outcomes = Object.values(plan.resolution.outcomes);
    const secondarySaves = outcomes.flatMap(outcome =>
        outcome.followUps.filter(followUp => followUp.kind === "save")
    );
    const linkedConditionCount = outcomes.reduce((total, outcome) =>
        total + outcome.effects.filter(effect => effect.whileCondition).length, 0);

    if (secondarySaves.length > 0) {
        plan.automation.compiledCapabilities.push("secondary-saves");
        plan.diagnostics.push(diagnostic(
            "info",
            "SECONDARY_SAVES_COMPILED",
            `${secondarySaves.length} secondary save${secondarySaves.length === 1 ? " was" : "s were"} compiled with independent decision windows.`
        ));
        const incompleteCount = secondarySaves.filter(save => !save.complete).length;
        if (incompleteCount > 0) {
            plan.automation.pendingCapabilities.push("secondary-save-branches");
            plan.diagnostics.push(diagnostic(
                "warning",
                "SECONDARY_SAVE_BRANCHES_PENDING",
                `${incompleteCount} secondary save${incompleteCount === 1 ? " has" : "s have"} outcome branches that remain unclaimed.`
            ));
        }
    }
    if (linkedConditionCount > 0) {
        plan.automation.compiledCapabilities.push("linked-conditions");
        plan.diagnostics.push(diagnostic(
            "info",
            "LINKED_CONDITIONS_COMPILED",
            `${linkedConditionCount} condition${linkedConditionCount === 1 ? " was" : "s were"} linked to the lifetime of another condition.`
        ));
    }
}

function addNativeSpellEffects(plan, compilation) {
    const mappedEffects = [];
    for (const degree of DEGREES) {
        const effects = compilation.outcomes[degree] ?? [];
        plan.resolution.outcomes[degree].nativeEffects.push(...effects);
        mappedEffects.push(...effects);
    }
    plan.nativeEffects.onUse = compilation.onUse;
    plan.nativeEffects.deferred = compilation.deferred;
    plan.nativeEffects.sequences = compilation.sequences;
    plan.nativeEffects.rankVariants = compilation.rankVariants;
    plan.nativeEffects.variantSelectors = compilation.variantSelectors;
    plan.nativeEffects.choiceVariants = compilation.choiceVariants;
    plan.nativeEffects.choiceSelectors = compilation.choiceSelectors;
    plan.nativeEffects.terminations = compilation.terminations;
    plan.nativeEffects.unscoped = compilation.unscoped;
    plan.lifecycle.termination.transitionIds = compilation.terminations.map(termination => termination.id);

    if (compilation.references.length === 0) return;
    plan.automation.compiledCapabilities.push("native-spell-effect-links");
    if (mappedEffects.length > 0) {
        plan.automation.compiledCapabilities.push("native-spell-effects");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_SPELL_EFFECTS_COMPILED",
            `${mappedEffects.length} outcome application${mappedEffects.length === 1 ? " was" : "s were"} compiled from native pf2e.spell-effects links.`
        ));
    }
    if (compilation.onUse.length > 0) {
        plan.automation.compiledCapabilities.push("native-spell-effect-on-use");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_SPELL_EFFECT_ON_USE_COMPILED",
            `${compilation.onUse.length} native spell effect${compilation.onUse.length === 1 ? " was" : "s were"} compiled for confirmed application after activation.`
        ));
    }
    if (compilation.sequences.length > 0) {
        plan.automation.compiledCapabilities.push("native-spell-effect-sequences");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_SPELL_EFFECT_SEQUENCE_COMPILED",
            `${compilation.sequences.length} native Effect sequence${compilation.sequences.length === 1 ? " was" : "s were"} compiled with a deferred successor.`
        ));
    }
    if (compilation.variantSelectors.length > 0) {
        plan.automation.compiledCapabilities.push("native-spell-effect-rank-variants");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_SPELL_EFFECT_RANK_VARIANT_COMPILED",
            `${compilation.variantSelectors.length} exclusive cast-rank selector${compilation.variantSelectors.length === 1 ? " was" : "s were"} compiled.`
        ));
    }
    if (compilation.choiceSelectors.length > 0) {
        plan.automation.compiledCapabilities.push("native-spell-effect-choice-variants");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_SPELL_EFFECT_CHOICE_VARIANT_COMPILED",
            `${compilation.choiceSelectors.length} exclusive player-choice selector${compilation.choiceSelectors.length === 1 ? " was" : "s were"} compiled.`
        ));
    }
    if (compilation.terminations.length > 0) {
        plan.automation.compiledCapabilities.push("native-effect-termination");
        plan.diagnostics.push(diagnostic(
            "info",
            "NATIVE_EFFECT_TERMINATION_COMPILED",
            `${compilation.terminations.length} confirmed Effect termination transition${compilation.terminations.length === 1 ? " was" : "s were"} compiled.`
        ));
    }
    if (compilation.unscoped.length > 0) {
        plan.automation.pendingCapabilities.push("native-spell-effect-scope");
        plan.diagnostics.push(diagnostic(
            "warning",
            "NATIVE_SPELL_EFFECT_SCOPE_PENDING",
            `${compilation.unscoped.length} native spell-effect link${compilation.unscoped.length === 1 ? " requires" : "s require"} an explicit trigger or outcome scope.`
        ));
    }
    const manualRecipients = [
        ...mappedEffects,
        ...compilation.onUse,
        ...compilation.deferred,
        ...compilation.rankVariants,
        ...compilation.choiceVariants,
        ...compilation.unscoped
    ]
        .filter(effect => effect.recipient.actor === "manual").length;
    if (manualRecipients > 0) {
        plan.automation.pendingCapabilities.push("native-spell-effect-recipient");
        plan.diagnostics.push(diagnostic(
            "warning",
            "NATIVE_SPELL_EFFECT_RECIPIENT_PENDING",
            `${manualRecipients} native spell-effect application${manualRecipients === 1 ? " needs" : "s need"} recipient confirmation.`
        ));
    }
    if (compilation.unresolvedCount > 0) {
        plan.automation.pendingCapabilities.push("native-spell-effect-resolution");
    }
}

function compileNonBasicDegreeSave(plan, adapted, description, componentIds) {
    if (description.sectionCount !== DEGREES.length) return false;

    const outcomes = {};
    for (const degree of DEGREES) {
        const section = description.sections[degree];
        const outcome = emptyOutcome();
        outcome.rawText = section.text;
        compileOutcomeDescription(outcome, {
            ...section,
            conditions: description.sectionConditions[degree]
        }, componentIds, plan.lifecycle);
        outcomes[degree] = outcome;
    }

    for (const degree of DEGREES) {
        const inherited = referencedDegree(outcomes[degree].rawText);
        if (inherited && inherited !== degree) outcomes[degree] = mergeInheritedOutcome(outcomes[inherited], outcomes[degree]);
    }
    attachOutcomeFormulaHeightening(outcomes, adapted);

    plan.resolution = {
        kind: "save",
        check: {
            statistic: adapted.defense.statistic,
            basic: false,
            dcSource: "source-actor"
        },
        sharedDamage: componentIds.length > 0 ? {
            mode: "pf2e-item-damage",
            rollOnce: true,
            components: adapted.damageComponents,
            heightening: adapted.heightening
        } : null,
        outcomes,
        postDamageTerminal: inferPostDamageTerminal(adapted.descriptionHTML)
    };
    const conditionCount = Object.values(outcomes).reduce((total, outcome) => total + outcome.effects.length, 0);
    const durationCount = Object.values(outcomes).reduce((total, outcome) =>
        total + outcome.effects.filter(effect => effect.duration).length, 0);
    const expirationEventCount = Object.values(outcomes).reduce((total, outcome) =>
        total + outcome.effects.filter(effect => effect.endsWhen).length, 0);
    const formulaCount = Object.values(outcomes).reduce((total, outcome) =>
        total + (outcome.damage.formulas?.length ?? 0), 0);
    plan.automation = {
        level: "guided",
        confidence: 0.65,
        compiledCapabilities: ["source", "targeting", "primary-save", "degree-sections", "reroll-policy"],
        pendingCapabilities: []
    };
    if (componentIds.length > 0) plan.automation.compiledCapabilities.push("shared-damage");
    if (conditionCount > 0) plan.automation.compiledCapabilities.push("condition-references");
    if (durationCount > 0) plan.automation.compiledCapabilities.push("condition-durations");
    if (expirationEventCount > 0) plan.automation.compiledCapabilities.push("condition-expiration-events");
    if (formulaCount > 0) plan.automation.compiledCapabilities.push("outcome-specific-damage");
    if (Object.values(outcomes).some(outcome => outcome.terminal)) plan.automation.compiledCapabilities.push("terminal-results");
    addPostDamageTerminalCapability(plan);
    const manualKinds = [...new Set(Object.values(outcomes)
        .flatMap(outcome => outcome.manualInstructions.map(instruction => instruction.kind)))];
    if (manualKinds.length > 0) plan.automation.pendingCapabilities.push(...manualKinds.map(kind => `manual:${kind}`));
    addOutcomeExtensionCapabilities(plan);
    plan.diagnostics.push(diagnostic(
        "info",
        "NON_BASIC_DEGREE_SECTIONS_COMPILED",
        `Four non-basic save outcomes were compiled (${conditionCount} condition references, ${formulaCount} outcome damage expressions).`
    ));
    if (Object.keys(description.inheritedSections).length > 0) {
        plan.diagnostics.push(diagnostic(
            "info",
            "OMITTED_CRITICAL_OUTCOMES_INHERITED",
            `PF2e ordinary outcomes were inherited for: ${Object.keys(description.inheritedSections).join(", ")}.`
        ));
    }
    if (durationCount > 0) {
        plan.diagnostics.push(diagnostic(
            "info",
            "CONDITION_DURATIONS_COMPILED",
            `${durationCount} mention-scoped condition durations were compiled.`
        ));
    }
    if (expirationEventCount > 0) {
        plan.diagnostics.push(diagnostic(
            "info",
            "CONDITION_EXPIRATION_EVENTS_COMPILED",
            `${expirationEventCount} condition expiration event${expirationEventCount === 1 ? " was" : "s were"} compiled.`
        ));
    }
    const unscopedDuration = hasUnscopedConditionDuration(outcomes);
    if (unscopedDuration) {
        plan.automation.pendingCapabilities.push("condition-duration-scope");
        plan.diagnostics.push(diagnostic(
            "warning",
            "CONDITION_DURATION_SCOPE_PENDING",
            "Condition durations require mention-scoped parsing before application is safe."
        ));
    }
    return true;
}

function basePlan(adapted) {
    const sustained = adapted.lifecycle.sustained;
    return {
        modelVersion: ABILITY_MODEL_VERSION,
        compilerVersion: COMPILER_VERSION,
        source: adapted.source,
        rank: adapted.rank,
        category: adapted.category,
        activation: adapted.activation,
        targeting: {
            ...adapted.targeting,
            actorConstraints: compileActorTargetConstraints(adapted.targeting, {
                requiresActorTargets: adapted.defense.kind === "save",
                descriptionHTML: adapted.descriptionHTML
            })
        },
        traits: [...adapted.activation.traits],
        trigger: {
            event: "use",
            timing: "manual-confirmation",
            frequency: null,
            immunity: null
        },
        decisionWindows: {
            beforeRoll: true,
            nativeRollDialog: true,
            provisionalResult: true,
            rerollBeforeApplication: "replace",
            rerollAfterApplication: "manual-review",
            applicationRequiresConfirmation: true
        },
        lifecycle: {
            duration: adapted.lifecycle.duration,
            durationSpec: compileItemDuration(adapted.lifecycle.duration, { sustained }),
            sustained,
            controller: {
                required: sustained,
                owner: sustained ? "source-actor" : null,
                documentType: sustained ? "effect" : null,
                castInstanceKey: sustained ? "runtime-assigned" : null,
                deletionEndsCast: sustained,
                removeDependentEffects: sustained
            },
            termination: { transitionIds: [] }
        },
        nativeEffects: {
            onUse: [],
            deferred: [],
            sequences: [],
            rankVariants: [],
            variantSelectors: [],
            choiceVariants: [],
            choiceSelectors: [],
            terminations: [],
            unscoped: []
        },
        resolution: {
            kind: "unsupported",
            check: null,
            sharedDamage: null,
            outcomes: Object.fromEntries(DEGREES.map(degree => [degree, emptyOutcome()])),
            postDamageTerminal: null
        },
        automation: {
            level: "unsupported",
            confidence: 0,
            compiledCapabilities: [],
            pendingCapabilities: []
        },
        diagnostics: []
    };
}

function compileSpell(item, options) {
    const adapted = adaptSpellSource(item, options);
    const plan = basePlan(adapted);
    const componentIds = adapted.damageComponents.map(component => component.id);
    const description = analyzeDescription(adapted.descriptionHTML);
    const nativeSpellEffects = compileNativeSpellEffects({
        html: adapted.descriptionHTML,
        sections: description.sections,
        targeting: adapted.targeting,
        hasPrimarySave: adapted.defense.kind === "save",
        catalog: options.nativeEffectCatalog ?? null
    });
    const unscopedEffectTriggers = compileUnscopedEffectTriggers(nativeSpellEffects.unscoped, {
        descriptionHTML: adapted.descriptionHTML,
        activation: adapted.activation,
        targeting: adapted.targeting,
        sustained: adapted.lifecycle.sustained,
        hasPrimarySave: adapted.defense.kind === "save",
        sectionCount: description.sectionCount,
        inlineChecks: description.inlineChecks,
        referenceCount: nativeSpellEffects.references.length
    });
    nativeSpellEffects.onUse = unscopedEffectTriggers.onUse;
    nativeSpellEffects.unscoped = unscopedEffectTriggers.pending;
    nativeSpellEffects.deferred = [];
    nativeSpellEffects.sequences = [];
    nativeSpellEffects.rankVariants = [];
    nativeSpellEffects.variantSelectors = [];
    nativeSpellEffects.choiceVariants = [];
    nativeSpellEffects.choiceSelectors = [];
    nativeSpellEffects.terminations = [];
    const multiEffectSequence = compileMultiEffectSequence(nativeSpellEffects.unscoped, {
        descriptionHTML: adapted.descriptionHTML,
        targeting: adapted.targeting,
        hasPrimarySave: adapted.defense.kind === "save",
        sectionCount: description.sectionCount,
        inlineChecks: description.inlineChecks
    });
    if (multiEffectSequence) {
        nativeSpellEffects.onUse = multiEffectSequence.onUse;
        nativeSpellEffects.deferred = multiEffectSequence.deferred;
        nativeSpellEffects.sequences = multiEffectSequence.sequences;
        nativeSpellEffects.unscoped = [];
    }
    const rankVariantSelection = compileRankVariantSelection(nativeSpellEffects.unscoped, adapted);
    if (rankVariantSelection) {
        nativeSpellEffects.rankVariants = rankVariantSelection.effects;
        nativeSpellEffects.variantSelectors = rankVariantSelection.selectors;
        nativeSpellEffects.unscoped = [];
    }
    const choiceVariantSelection = compileChoiceVariantSelection(nativeSpellEffects.unscoped, adapted);
    if (choiceVariantSelection) {
        nativeSpellEffects.choiceVariants = choiceVariantSelection.effects;
        nativeSpellEffects.choiceSelectors = choiceVariantSelection.selectors;
        nativeSpellEffects.unscoped = [];
    }
    Object.assign(nativeSpellEffects, compileEffectTerminations(nativeSpellEffects, adapted));
    const effectSequenceResolution = compileEffectSequenceResolution(
        adapted,
        nativeSpellEffects,
        plan.resolution.outcomes
    );
    const rankVariantResolution = compileRankVariantResolution(
        adapted,
        nativeSpellEffects,
        plan.resolution.outcomes
    );
    const choiceVariantResolution = compileChoiceVariantResolution(
        adapted,
        nativeSpellEffects,
        plan.resolution.outcomes
    );
    const directEffectResolution = compileDirectEffectResolution(
        adapted,
        nativeSpellEffects,
        plan.resolution.outcomes
    );
    plan.compilerEvidence = {
        degreeSections: Object.fromEntries(Object.entries(description.sections).map(([degree, section]) => [degree, section.text])),
        explicitDegreeSections: description.explicitSectionCount,
        inheritedDegreeSections: description.inheritedSections,
        inlineChecks: description.inlineChecks,
        inlineDamage: description.inlineDamage,
        conditionReferences: description.allConditionReferences.length,
        spellEffectReferences: description.spellEffectReferences.length,
        nativeSpellEffects: {
            references: nativeSpellEffects.references.length,
            outcomeApplications: Object.values(nativeSpellEffects.outcomes)
                .reduce((total, effects) => total + effects.length, 0),
            onUse: nativeSpellEffects.onUse.length,
            deferred: nativeSpellEffects.deferred.length,
            sequences: nativeSpellEffects.sequences.length,
            rankVariants: nativeSpellEffects.rankVariants.length,
            variantSelectors: nativeSpellEffects.variantSelectors.length,
            choiceVariants: nativeSpellEffects.choiceVariants.length,
            choiceSelectors: nativeSpellEffects.choiceSelectors.length,
            terminations: nativeSpellEffects.terminations.length,
            unscoped: nativeSpellEffects.unscoped.length,
            resolved: nativeSpellEffects.resolvedCount,
            unresolved: nativeSpellEffects.unresolvedCount
        },
        actionReferences: description.actionReferences,
        templates: description.templates,
        hasArrivalDeparture: description.hasArrivalDeparture,
        hasAfflictionBlock: description.hasAfflictionBlock
    };
    if (directEffectResolution) {
        plan.compilerEvidence.directEffectCompleteness = directEffectResolution.completeness;
    }
    if (effectSequenceResolution) {
        plan.compilerEvidence.effectSequenceCompleteness = effectSequenceResolution.completeness;
    }
    if (rankVariantResolution) {
        plan.compilerEvidence.rankVariantCompleteness = rankVariantResolution.completeness;
    }
    if (choiceVariantResolution) {
        plan.compilerEvidence.choiceVariantCompleteness = choiceVariantResolution.completeness;
    }

    if (adapted.defense.kind === "save" && adapted.defense.basic && componentIds.length > 0) {
        plan.resolution = {
            kind: "save",
            check: {
                statistic: adapted.defense.statistic,
                basic: true,
                dcSource: "source-actor"
            },
            sharedDamage: {
                mode: "pf2e-item-damage",
                rollOnce: true,
                components: adapted.damageComponents,
                heightening: adapted.heightening
            },
            outcomes: basicSaveOutcomes(componentIds),
            postDamageTerminal: inferPostDamageTerminal(adapted.descriptionHTML)
        };
        plan.automation = {
            // Structured damage is compiled, but description riders have not
            // yet passed through the extracted semantic parser.
            level: "guided",
            confidence: 0.75,
            compiledCapabilities: ["source", "targeting", "primary-save", "shared-damage", "basic-save-scaling", "reroll-policy"],
            pendingCapabilities: ["description-effects", "description-target-predicates", "description-lifecycle"]
        };
        plan.diagnostics.push(diagnostic(
            "info",
            "BASIC_SAVE_DAMAGE_COMPILED",
            "Structured PF2e damage and standard basic-save scaling were compiled."
        ));
        plan.diagnostics.push(diagnostic(
            "warning",
            "DESCRIPTION_SEMANTICS_PENDING",
            "Description riders have not yet been compiled; the complete ability remains guided.",
            "$.system.description.value"
        ));

        const completeness = assessSimpleBasicSaveDescription(adapted, description);
        plan.compilerEvidence.simpleBasicSaveGate = completeness;
        if (completeness.complete) {
            plan.automation.level = "automatic";
            plan.automation.confidence = 1;
            plan.automation.compiledCapabilities.push("complete-description");
            plan.automation.pendingCapabilities = [];
            plan.diagnostics = plan.diagnostics.filter(entry => entry.code !== "DESCRIPTION_SEMANTICS_PENDING");
            plan.diagnostics.push(diagnostic(
                "info",
                "SIMPLE_BASIC_SAVE_COMPLETE",
                "The description contains one matching damage-only basic save and no uncompiled mechanic signals."
            ));
        } else {
            plan.diagnostics.push(diagnostic(
                "info",
                "SIMPLE_BASIC_SAVE_GATE_REJECTED",
                `Complete automation was withheld: ${completeness.reasons.join(", ")}.`
            ));
        }

        const sectionsBelongToPrimarySave = description.sectionCount > 0
            && description.inlineChecks === 0
            && !description.hasArrivalDeparture;
        if (sectionsBelongToPrimarySave) {
            let compiledConditionCount = 0;
            for (const degree of DEGREES) {
                const section = description.sections[degree];
                if (!section) continue;
                const outcome = plan.resolution.outcomes[degree];
                outcome.rawText = section.text;
                compileOutcomeDescription(outcome, {
                    ...section,
                    conditions: description.sectionConditions[degree]
                }, componentIds, plan.lifecycle);
                compiledConditionCount += outcome.effects.length;
            }
            plan.automation.compiledCapabilities.push("degree-sections");
            plan.diagnostics.push(diagnostic(
                "info",
                "PRIMARY_DEGREE_SECTIONS_COMPILED",
                `${description.sectionCount} primary degree-of-success sections were compiled.`
            ));
            if (compiledConditionCount > 0) {
                plan.automation.compiledCapabilities.push("condition-references");
                plan.diagnostics.push(diagnostic(
                    "info",
                    "CONDITION_REFERENCES_COMPILED",
                    `${compiledConditionCount} degree-scoped PF2e condition references were compiled.`
                ));
                const durationCount = DEGREES.reduce((total, degree) => total
                    + description.sectionConditions[degree].filter(effect => effect.duration).length, 0);
                if (durationCount > 0) {
                    plan.automation.compiledCapabilities.push("condition-durations");
                    plan.diagnostics.push(diagnostic(
                        "info",
                        "CONDITION_DURATIONS_COMPILED",
                        `${durationCount} mention-scoped condition durations were compiled.`
                    ));
                }
                const expirationEventCount = DEGREES.reduce((total, degree) => total
                    + plan.resolution.outcomes[degree].effects.filter(effect => effect.endsWhen).length, 0);
                if (expirationEventCount > 0) {
                    plan.automation.compiledCapabilities.push("condition-expiration-events");
                    plan.diagnostics.push(diagnostic(
                        "info",
                        "CONDITION_EXPIRATION_EVENTS_COMPILED",
                        `${expirationEventCount} condition expiration event${expirationEventCount === 1 ? " was" : "s were"} compiled.`
                    ));
                }
                const hasUnscopedDuration = hasUnscopedConditionDuration(plan.resolution.outcomes);
                if (hasUnscopedDuration) {
                    plan.automation.pendingCapabilities.push("condition-duration-scope");
                    plan.diagnostics.push(diagnostic(
                        "warning",
                        "CONDITION_DURATION_SCOPE_PENDING",
                        "One or more condition durations require mention-scoped parsing before application is safe."
                    ));
                }
            }
            const manualKinds = [...new Set(DEGREES.flatMap(degree =>
                plan.resolution.outcomes[degree].manualInstructions.map(instruction => instruction.kind)))];
            if (manualKinds.length > 0) plan.automation.pendingCapabilities.push(...manualKinds.map(kind => `manual:${kind}`));
            addOutcomeExtensionCapabilities(plan);
        } else if (description.sectionCount > 0) {
            plan.automation.pendingCapabilities.push("multi-check-degree-scope");
            plan.diagnostics.push(diagnostic(
                "warning",
                "DEGREE_SECTION_SCOPE_AMBIGUOUS",
                "Degree sections were not attached to the primary save because the description contains another check or multiple phases."
            ));
        }
        addPostDamageTerminalCapability(plan);
    } else if (adapted.defense.kind === "save" && !adapted.defense.basic
        && compileNonBasicDegreeSave(plan, adapted, description, componentIds)) {
        // The helper populates a conservative guided plan.
    } else if (effectSequenceResolution) {
        plan.resolution = effectSequenceResolution.resolution;
        plan.automation = effectSequenceResolution.automation;
        plan.diagnostics.push(diagnostic(
            effectSequenceResolution.completeness.complete ? "info" : "warning",
            effectSequenceResolution.completeness.complete
                ? "EFFECT_SEQUENCE_RESOLUTION_COMPLETE"
                : "EFFECT_SEQUENCE_RESOLUTION_GUIDED",
            effectSequenceResolution.completeness.complete
                ? "The primary and deferred native PF2e Effects form a complete interactive sequence."
                : `The native Effect sequence was compiled, with remaining semantics: ${effectSequenceResolution.completeness.blockers.join(", ")}.`
        ));
    } else if (rankVariantResolution) {
        plan.resolution = rankVariantResolution.resolution;
        plan.automation = rankVariantResolution.automation;
        plan.diagnostics.push(diagnostic(
            rankVariantResolution.completeness.complete ? "info" : "warning",
            rankVariantResolution.completeness.complete
                ? "RANK_VARIANT_RESOLUTION_COMPLETE"
                : "RANK_VARIANT_RESOLUTION_GUIDED",
            rankVariantResolution.completeness.complete
                ? "Cast rank deterministically selects one exclusive native PF2e Effect."
                : `The rank selector was compiled, with remaining semantics: ${rankVariantResolution.completeness.blockers.join(", ")}.`
        ));
    } else if (choiceVariantResolution) {
        plan.resolution = choiceVariantResolution.resolution;
        plan.automation = choiceVariantResolution.automation;
        plan.diagnostics.push(diagnostic(
            choiceVariantResolution.completeness.complete ? "info" : "warning",
            choiceVariantResolution.completeness.complete
                ? "CHOICE_VARIANT_RESOLUTION_COMPLETE"
                : "CHOICE_VARIANT_RESOLUTION_GUIDED",
            choiceVariantResolution.completeness.complete
                ? "One explicit player choice deterministically selects one native PF2e Effect."
                : `The choice selector was compiled, with remaining semantics: ${choiceVariantResolution.completeness.blockers.join(", ")}.`
        ));
    } else if (directEffectResolution) {
        plan.resolution = directEffectResolution.resolution;
        plan.automation = directEffectResolution.automation;
        plan.diagnostics.push(diagnostic(
            directEffectResolution.completeness.complete ? "info" : "warning",
            directEffectResolution.completeness.complete
                ? "DIRECT_EFFECT_RESOLUTION_COMPLETE"
                : "DIRECT_EFFECT_RESOLUTION_GUIDED",
            directEffectResolution.completeness.complete
                ? "The ability resolves through one authoritative native PF2e Effect."
                : `The native Effect application was compiled, with remaining semantics: ${directEffectResolution.completeness.blockers.join(", ")}.`
        ));
    } else {
        const path = adapted.defense.kind === "save"
            ? adapted.defense.basic ? "basic-save-without-structured-damage" : "non-basic-save"
            : "no-primary-save";
        plan.automation.pendingCapabilities = [path, "description-semantics"];
        plan.diagnostics.push(diagnostic(
            "warning",
            "COMPILER_PATH_NOT_IMPLEMENTED",
            `The ${path} compiler path has not been extracted from macro v8.40 yet.`
        ));
    }

    addNativeSpellEffects(plan, nativeSpellEffects);
    if (plan.automation.compiledCapabilities.includes("degree-sections")) addResidualProseAnalysis(plan);
    plan.automation.delegatedCapabilities = [];
    plan.delegations = [];
    if (plan.lifecycle.durationSpec.mode === "text") {
        plan.automation.pendingCapabilities.push("item-duration-grammar");
    } else {
        plan.automation.compiledCapabilities.push("item-duration");
    }
    if (plan.lifecycle.sustained) plan.automation.compiledCapabilities.push("sustained-lifecycle");
    if (plan.targeting.actorConstraints.complete) {
        plan.automation.compiledCapabilities.push("actor-target-constraints");
    } else {
        plan.automation.pendingCapabilities.push("target-eligibility");
        plan.diagnostics.push(diagnostic(
            "warning",
            "TARGET_ELIGIBILITY_PENDING",
            `Target eligibility was not fully compiled from ${JSON.stringify(plan.targeting.actorConstraints.sourceText)}.`
        ));
    }
    if (description.hasAfflictionBlock) {
        plan.automation.delegatedCapabilities.push("affliction-resolution");
        plan.delegations.push({
            capability: "affliction-resolution",
            handler: "external-module",
            policy: "exclude-from-outcome-compilation"
        });
        plan.diagnostics.push(diagnostic(
            "info",
            "AFFLICTION_RESOLUTION_DELEGATED",
            "Affliction stages were excluded from spell-outcome compilation and delegated to an external module."
        ));
    }

    const validationErrors = validateAbilityPlan(plan);
    plan.diagnostics.push(...validationErrors);
    if (validationErrors.length) {
        plan.automation.level = "unsafe";
        plan.automation.confidence = 0;
    }
    return finalizePlan(plan);
}

export function compileAbility(item, options = {}) {
    try {
        if (item?.type === "spell") return compileSpell(item, options);
        const type = item?.type ?? "missing";
        return {
            modelVersion: ABILITY_MODEL_VERSION,
            compilerVersion: COMPILER_VERSION,
            source: { documentType: "Item", itemType: type, id: item?._id ?? null, name: item?.name ?? "Unknown Ability" },
            automation: { level: "unsupported", confidence: 0, compiledCapabilities: [], pendingCapabilities: ["source-adapter"] },
            diagnostics: [diagnostic("warning", "SOURCE_ADAPTER_NOT_IMPLEMENTED", `No source adapter exists for item type ${JSON.stringify(type)}.`)]
        };
    } catch (error) {
        return {
            modelVersion: ABILITY_MODEL_VERSION,
            compilerVersion: COMPILER_VERSION,
            source: { documentType: "Item", itemType: item?.type ?? null, id: item?._id ?? null, name: item?.name ?? "Unknown Ability" },
            automation: { level: "unsafe", confidence: 0, compiledCapabilities: [], pendingCapabilities: [] },
            diagnostics: [diagnostic("error", "COMPILER_EXCEPTION", error instanceof Error ? error.message : String(error))]
        };
    }
}
