import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const NON_ACTOR_TARGET = /\b(?:object|weapon|club|staff|food|liquid|structure|hazard|door|container|corpse|item)\b/i;
const AREA_OR_AURA = /@Template\[|\b(?:aura|emanation|burst|cone|line)\b/i;
const TRIGGER_HEADING = /<strong\b[^>]*>\s*Trigger\b/i;
const TARGET_APPLICATION = /\b(?:the target|target|the touched creature|touched creature|the targeted creature|targeted creature|it)\s+(?:also\s+)?(?:gains?|receives?|becomes?|is granted)\b|\byou grant (?:the )?(?:target|touched creature)\b/i;
const SOURCE_APPLICATION = /^(?:(?:while|for)\s+[^,.]{1,120},\s*)?you\s+(?:gain|become|receive|have|take)\b|^you(?:'re| are)\s+(?:surrounded|transformed|warded|protected)\b|^you\s+ward yourself\b/i;
const CONDITIONAL_PREFIX = /\b(?:if|when|whenever|after|before|once|until|unless)\b|\bon (?:a )?(?:critical )?(?:success|failure)\b/i;

function linkIsInsideOptionBlock(html, sourceText) {
    const source = String(html ?? "");
    const index = source.indexOf(sourceText);
    if (index < 0) return false;
    const before = source.slice(0, index);
    return before.lastIndexOf("<li") > before.lastIndexOf("</li>")
        && /<strong\b/i.test(before.slice(before.lastIndexOf("<li")));
}

function applicationEvidence(text, pattern) {
    const clauses = String(text ?? "").split(/(?<=[.!?;])\s+|\n+/).map(clause => clause.trim()).filter(Boolean);
    for (const clause of clauses) {
        const match = pattern.exec(clause);
        pattern.lastIndex = 0;
        if (!match) continue;
        const prefix = clause.slice(0, match.index);
        if (!CONDITIONAL_PREFIX.test(prefix)) return clause;
    }
    return null;
}

function classifyImmediateApplication(effect, context) {
    const reasons = [];
    const target = String(context.targeting?.target ?? "");
    const baseText = htmlToPlainText(stripHeighteningHTML(context.descriptionHTML));
    const targetEvidence = applicationEvidence(baseText, TARGET_APPLICATION);
    const sourceEvidence = applicationEvidence(baseText, SOURCE_APPLICATION);

    if (context.referenceCount !== 1) reasons.push("multiple-native-effects");
    if (context.sectionCount > 0) reasons.push("degree-sections-present");
    if (context.hasPrimarySave) reasons.push("primary-save-present");
    if (context.inlineChecks > 0) reasons.push("inline-check-present");
    if (context.targeting?.area || AREA_OR_AURA.test(context.descriptionHTML)) reasons.push("area-or-aura-present");
    if (TRIGGER_HEADING.test(context.descriptionHTML) || /\breaction\b/i.test(context.activation?.time ?? "")) {
        reasons.push("reaction-trigger-present");
    }
    if (linkIsInsideOptionBlock(context.descriptionHTML, effect.sourceText)) reasons.push("option-block-link");
    if (/\bimmunit(?:y|ies)\b/i.test(effect.reference)) reasons.push("immunity-effect");
    if (NON_ACTOR_TARGET.test(target)) reasons.push("non-actor-target");

    let recipient = null;
    let evidence = null;
    if (!target && sourceEvidence) {
        recipient = { actor: "source", evidence: "immediate-source-language" };
        evidence = sourceEvidence;
    } else if (target && !NON_ACTOR_TARGET.test(target) && targetEvidence) {
        recipient = { actor: "target", evidence: "immediate-target-language" };
        evidence = targetEvidence;
    } else if (!targetEvidence && !sourceEvidence) {
        reasons.push("immediate-application-not-explicit");
    } else {
        reasons.push("recipient-not-safe");
    }

    return { safe: reasons.length === 0, reasons: [...new Set(reasons)], recipient, evidence };
}

export function compileUnscopedEffectTriggers(effects, context = {}) {
    const onUse = [];
    const pending = [];

    for (const effect of effects ?? []) {
        const classification = classifyImmediateApplication(effect, context);
        if (!classification.safe) {
            pending.push({
                ...effect,
                triggerAnalysis: {
                    status: "pending",
                    reasons: classification.reasons
                }
            });
            continue;
        }

        onUse.push({
            ...effect,
            recipient: classification.recipient,
            scope: "on-use",
            trigger: {
                event: "use",
                timing: "after-activation",
                once: true
            },
            lifecycleBinding: context.sustained ? "cast-controller" : null,
            triggerAnalysis: {
                status: "compiled",
                evidence: classification.evidence
            }
        });
    }

    return { onUse, pending };
}
