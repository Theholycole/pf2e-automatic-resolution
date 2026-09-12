import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const IMMUNITY_NAME = /\bimmunit(?:y|ies)\b/i;

function recipientForSequence(target) {
    return String(target ?? "").trim()
        ? { actor: "target", evidence: "structured-sequence-target" }
        : { actor: "source", evidence: "implicit-self-sequence" };
}

function sequenceTransition(text, primary) {
    if (/\beither way\b[^.!?]*\btemporarily immune\b/i.test(text)) {
        return {
            event: "effect-ended",
            sourceEffectUuid: primary.uuid,
            reasons: ["consumed", "expired"]
        };
    }

    const action = text.match(/\bafter you use\s+@UUID\[([^\]]+)\](?:\{([^}]+)\})?[^.!?]*\bthe spell ends\b/i);
    if (action) {
        return {
            event: "action-used",
            actionUuid: action[1],
            actionLabel: action[2] ?? action[1].split(".Item.").at(-1),
            sourceEffectUuid: primary.uuid,
            removesSourceEffect: true
        };
    }
    const linkedAction = text.match(/@UUID\[((?:Compendium\.)?[^\]]+\.(?:Item\.)?[^\]]+)\](?:\{([^}]+)\})?/i);
    if (linkedAction) {
        const actionLabel = linkedAction[2] ?? linkedAction[1].split(".Item.").at(-1);
        const escapedLabel = actionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const plainAction = new RegExp(`\\bafter you use ${escapedLabel}[^.!?]*\\bthe spell ends\\b`, "i");
        if (plainAction.test(text)) {
            return {
                event: "action-used",
                actionUuid: linkedAction[1],
                actionLabel,
                sourceEffectUuid: primary.uuid,
                removesSourceEffect: true
            };
        }
    }
    return null;
}

export function compileMultiEffectSequence(effects, context = {}) {
    if ((effects ?? []).length !== 2) return null;
    const immunity = effects.find(effect => IMMUNITY_NAME.test(effect.reference));
    const primary = effects.find(effect => effect !== immunity);
    if (!primary || !immunity) return null;
    if (context.hasPrimarySave || context.sectionCount > 0 || context.inlineChecks > 0
        || context.targeting?.area) return null;

    const text = htmlToPlainText(stripHeighteningHTML(context.descriptionHTML));
    const transition = sequenceTransition(text, primary);
    if (!transition) return null;
    const recipient = recipientForSequence(context.targeting?.target);
    const id = `${primary.uuid}=>${immunity.uuid}`;

    return {
        onUse: [{
            ...primary,
            recipient,
            scope: "on-use",
            trigger: { event: "use", timing: "after-activation", once: true },
            triggerAnalysis: {
                status: "compiled",
                evidence: "primary-effect-in-sequence"
            },
            sequenceId: id
        }],
        deferred: [{
            ...immunity,
            recipient,
            scope: "deferred",
            trigger: transition,
            triggerAnalysis: {
                status: "compiled",
                evidence: transition.event === "effect-ended"
                    ? "either-way-immunity"
                    : "action-use-immunity"
            },
            sequenceId: id
        }],
        sequences: [{
            id,
            primaryEffectUuid: primary.uuid,
            successorEffectUuid: immunity.uuid,
            transition,
            reapplication: {
                blockedWhileSuccessorActive: true,
                blockerEffectUuid: immunity.uuid,
                recipient: "sequence-recipient",
                reason: "temporary-immunity"
            }
        }]
    };
}

export function compileEffectSequenceResolution(adapted, nativeEffects, outcomes) {
    const outcomeApplications = Object.values(nativeEffects.outcomes ?? {})
        .reduce((total, effects) => total + effects.length, 0);
    const eligible = adapted.defense.kind === "none"
        && adapted.damageComponents.length === 0
        && nativeEffects.onUse.length === 1
        && nativeEffects.deferred.length === 1
        && nativeEffects.unscoped.length === 0
        && nativeEffects.sequences.length === 1
        && outcomeApplications === 0;
    if (!eligible) return null;

    const documentsAudited = [...nativeEffects.onUse, ...nativeEffects.deferred]
        .every(effect => effect.document?.automation != null);
    const blockers = documentsAudited ? [] : ["effect-documents-not-audited"];
    const transition = nativeEffects.sequences[0].transition;
    if (transition.event === "effect-ended" && transition.reasons?.includes("consumed")
        && nativeEffects.onUse[0].document?.automation?.removesAfterRoll !== true) {
        blockers.push("primary-effect-consumption-not-native");
    }
    return {
        resolution: {
            kind: "effect-sequence",
            check: null,
            sharedDamage: null,
            outcomes,
            postDamageTerminal: null,
            applications: [
                {
                    kind: "native-spell-effect",
                    uuid: nativeEffects.onUse[0].uuid,
                    source: "nativeEffects.onUse",
                    ...(nativeEffects.onUse[0].terminationId
                        ? { terminationId: nativeEffects.onUse[0].terminationId }
                        : {})
                },
                { kind: "native-spell-effect", uuid: nativeEffects.deferred[0].uuid, source: "nativeEffects.deferred" }
            ],
            sequenceId: nativeEffects.sequences[0].id
        },
        automation: {
            level: blockers.length === 0 ? "prompted" : "guided",
            confidence: blockers.length === 0 ? 1 : 0.75,
            compiledCapabilities: [
                "source",
                "targeting",
                "effect-sequence-resolution",
                "native-spell-effect-on-use",
                "deferred-native-spell-effect"
            ],
            pendingCapabilities: blockers.map(blocker => `effect-sequence:${blocker}`)
        },
        completeness: {
            complete: blockers.length === 0,
            blockers,
            requiresInteraction: true
        }
    };
}
