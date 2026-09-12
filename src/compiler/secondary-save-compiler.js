import {
    extractInlineExpressions,
    extractScopedConditionReferences,
    inferDamageMultiplier
} from "./description-parser.js";
import { compileEffectDuration } from "./duration-compiler.js";
import { compileLinkedConditions } from "./linked-condition-compiler.js";
import { cloneJSON, normalizeSlug } from "./normalize.js";
import { classifyManualSemantics, inferTerminalResult } from "./outcome-semantics.js";

const SAVE = /\b(?:must|has to)\s+(?:also\s+)?(?:attempt|make|succeed at)\s+(?:an?\s+)?(?:@Check\[(fortitude|reflex|will)([^\]]*)\](?:\{[^}]*\})?|(Fortitude|Reflex|Will)\s+(?:save|saving throw))/i;

function parseTraits(match, text) {
    const traits = new Set();
    const inline = match[2] ?? "";
    const inlineTraits = inline.match(/(?:^|\|)traits:([^|]+)/i)?.[1] ?? "";
    for (const trait of inlineTraits.split(",").map(value => value.trim().toLowerCase()).filter(Boolean)) {
        traits.add(trait);
    }
    const prose = String(text ?? "").match(/\b(?:this (?:second )?(?:save|saving throw)|(?:save|saving throw) that) has the ([^.;&]+?) traits?\b/i)?.[1] ?? "";
    for (const trait of prose.split(/,|\band\b/i).map(value => value.trim().toLowerCase()).filter(Boolean)) {
        traits.add(trait);
    }
    if (/\bincapacitation trait\b/i.test(text)) traits.add("incapacitation");
    if (/\bdeath (?:and )?incapacitation traits?\b/i.test(text)) traits.add("death");
    return [...traits];
}

function inferTiming(text) {
    if (/\bat the end of each of (?:its|their|the target'?s|the creature'?s) turns?\b/i.test(text)) {
        return { event: "turn-end", recurring: true, subject: "affected-actor" };
    }
    if (/\b(?:begins?|starts?) (?:its|their) turn\b|\bstarts? (?:its|their) turn\b/i.test(text)) {
        return { event: "turn-start", recurring: true, subject: "affected-actor" };
    }
    if (/\b(?:tries|attempts) to use (?:a )?[^.;]+ action\b/i.test(text)) {
        return { event: "before-action", recurring: false, subject: "affected-actor" };
    }
    return { event: "after-primary-outcome", recurring: false, subject: "affected-actor" };
}

function branchOutcome(text, { conditionalScopeClaimed = true, lifecycle = null } = {}) {
    const rawText = String(text ?? "").trim();
    const damageExpressions = extractInlineExpressions(rawText, "@Damage[");
    const multiplier = inferDamageMultiplier(rawText);
    const effects = compileLinkedConditions(extractScopedConditionReferences(rawText), rawText)
        .map(effect => compileEffectDuration(effect, rawText, lifecycle));
    let damage = { mode: "none", multiplier: 0, sourceComponentIds: [] };
    if (damageExpressions.length) {
        damage = {
            mode: "formulas",
            formulas: damageExpressions.map(expression => ({ formula: expression.body, source: "description-inline" })),
            rollScope: "secondary-outcome"
        };
    } else if (multiplier != null) {
        damage = { mode: "primary-shared", multiplier };
    }

    return {
        damage,
        effects,
        terminal: inferTerminalResult(rawText, { conditionalScopeClaimed }),
        manualInstructions: classifyManualSemantics(rawText).filter(instruction => instruction.kind !== "secondary-save"),
        rawText
    };
}

function extractBranchText(source, kind) {
    const patterns = kind === "criticalFailure" ? [
        /\bif (?:it|the target|the creature) critically fails,?\s*([^.;]+(?:[.;]|$))/i,
        /\bon a critical failure,\s*([^.;]+(?:[.;]|$))/i
    ] : kind === "failure" ? [
        /\bif (?:it|the target|the creature) fails(?: the (?:second )?save)?,?\s*([^.;]+(?:[.;]|$))/i,
        /\bon a failure,?\s*([^.;]+(?:[.;]|$))/i,
        /\bon a failed save,?\s*([^.;]+(?:[.;]|$))/i,
        /\bor\s+((?:be|become|die|lose|the action)[^.;]*(?:[.;]|$))/i
    ] : [
        /\b(?:on|with) a successful (?:Fortitude|Reflex|Will) (?:save|saving throw),?\s*([\s\S]+?)(?=\bif (?:it|the target|the creature) fails\b|$)/i,
        /\ba successful save,?\s*([^.;]+(?:[.;]|$))/i,
        /\bif (?:it|the target|the creature) succeeds(?: at| on)? (?:its|the)?\s*(?:save)?,?\s*([\s\S]+?)(?=\bif (?:it|the target|the creature) fails\b|$)/i,
        /\bif (?:it|the target|the creature) succeeds,?\s*([\s\S]+?)(?=\bif (?:it|the target|the creature) fails\b|$)/i
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(source);
        if (match?.[1]?.trim()) return match[1].trim();
    }
    return null;
}

function conditionDeltaBranches(sourceText, lifecycle) {
    const tracked = sourceText.match(/\b(?:(?:the )?(?:creature'?s|target'?s) )?([a-z-]+) (?:condition|value) increases?\b/i)?.[1]
        ?? sourceText.match(/\breduces? (?:(?:the )?(?:creature'?s|target'?s) )?([a-z-]+) (?:condition|value)\b/i)?.[1];
    if (!tracked) return null;

    const failure = sourceText.match(/\bfailed save[^.;]{0,120}?increases? by (\d+)/i)?.[1];
    const criticalFailure = sourceText.match(/\bor (?:by )?(\d+) on a critical failure\b/i)?.[1]
        ?? sourceText.match(/\bcritical failure[^.;]{0,120}?increases? by (\d+)/i)?.[1];
    const success = sourceText.match(/\bsuccessful save[^.;]{0,120}?reduces?[^.;]{0,80}? by (\d+)/i)?.[1];
    const criticalSuccess = sourceText.match(/\bor (?:by )?(\d+) on a critical success\b/i)?.[1]
        ?? sourceText.match(/\bcritical success[^.;]{0,120}?reduces?[^.;]{0,80}? by (\d+)/i)?.[1]
        ?? success;
    if (!failure && !criticalFailure && !success) return null;

    const condition = normalizeSlug(tracked);
    const outcome = (verb, value, sign) => value == null ? null : ({
        ...branchOutcome(`${verb} ${tracked} by ${value}.`, { lifecycle }),
        stateChanges: [{ kind: "condition-value", condition, delta: sign * Number(value) }]
    });
    return {
        criticalSuccess: outcome("Reduce", criticalSuccess, -1),
        success: outcome("Reduce", success, -1),
        failure: outcome("Increase", failure, 1),
        criticalFailure: outcome("Increase", criticalFailure ?? failure, 1)
    };
}

function sentenceStart(text, index) {
    const boundary = Math.max(text.lastIndexOf(".", index - 1), text.lastIndexOf("\n", index - 1));
    return boundary < 0 ? 0 : boundary + 1;
}

export function compileSecondarySave(section, { lifecycle = null } = {}) {
    // A new bold block heading means the text has left this degree of success
    // (for example, Pyrotechnics' separate Smoke Cloud option or an incarnate's
    // Depart phase). Those saves require a phase compiler, not inheritance from
    // the preceding outcome.
    if (/<strong\b/i.test(String(section?.html ?? ""))) return null;
    const text = String(section?.text ?? "").replace(/[’]/g, "'");
    const match = SAVE.exec(text);
    if (!match) return null;

    const sourceStart = sentenceStart(text, match.index);
    const sourceText = text.slice(sourceStart).trim();
    const statistic = (match[1] ?? match[3]).toLowerCase();
    const deltaBranches = conditionDeltaBranches(sourceText, lifecycle);
    const successText = extractBranchText(sourceText, "success");
    const failureText = extractBranchText(sourceText, "failure");
    const criticalFailureText = extractBranchText(sourceText, "criticalFailure");
    const impliedNoEffectOnSuccess = !successText
        && (/\bmust\s+(?:also\s+)?succeed\b/i.test(sourceText)
            || /\b(?:on a failure|if (?:it|the target|the creature) fails)\b/i.test(sourceText));
    let success = successText
        ? branchOutcome(successText, { lifecycle })
        : impliedNoEffectOnSuccess ? branchOutcome("No additional effect.", { lifecycle }) : null;
    let failure = failureText ? branchOutcome(failureText, { lifecycle }) : null;
    let criticalFailure = criticalFailureText
        ? branchOutcome(criticalFailureText, { lifecycle })
        : failure;
    let criticalSuccess = success;

    if (deltaBranches) {
        ({ criticalSuccess, success, failure, criticalFailure } = deltaBranches);
    } else if (/\bunless (?:it|the target|the creature) critically succeeded\b/i.test(sourceText) && success) {
        criticalSuccess = cloneJSON(success);
        const beforeException = sourceText.slice(0, sourceText.search(/\bunless (?:it|the target|the creature) critically succeeded\b/i));
        const excludedSlug = [...beforeException.matchAll(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([^\]]+)\](?:\{([^}]+)\})?/gi)]
            .map(reference => normalizeSlug((reference[2] ?? reference[1]).replace(/\s+\d+\s*$/, "")))
            .filter(Boolean)
            .at(-1);
        if (excludedSlug) criticalSuccess.effects = criticalSuccess.effects.filter(effect => effect.slug !== excludedSlug);
        success.manualInstructions = success.manualInstructions.filter(instruction => instruction.kind !== "conditional-effect");
        criticalSuccess.manualInstructions = criticalSuccess.manualInstructions.filter(instruction => instruction.kind !== "conditional-effect");
    }

    return {
        kind: "save",
        timing: inferTiming(sourceText),
        check: {
            statistic,
            basic: false,
            dcSource: "source-actor",
            traits: parseTraits(match, sourceText)
        },
        decisionWindows: {
            beforeRoll: true,
            nativeRollDialog: true,
            provisionalResult: true,
            rerollBeforeApplication: "replace",
            rerollAfterApplication: "manual-review",
            applicationRequiresConfirmation: true
        },
        outcomes: { criticalSuccess, success, failure, criticalFailure },
        complete: [criticalSuccess, success, failure, criticalFailure].every(Boolean),
        sourceRange: { start: sourceStart, end: text.length },
        rawText: sourceText
    };
}
