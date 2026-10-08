import { analyzeNativeEffectCompleteness } from "./direct-effect-resolution-compiler.js";
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { baseReference } from "./text-patterns.js";

function optionLabel(effect) {
    const suffix = String(effect.reference ?? "").match(/\(([^()]*)\)\s*$/)?.[1]?.trim();
    const linkedLabel = String(effect.label ?? "").trim();
    return (linkedLabel && linkedLabel !== effect.reference ? linkedLabel : null)
        || suffix
        || effect.reference;
}

function choiceId(label) {
    return String(label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function hasExplicitFormChoice(html) {
    const text = htmlToPlainText(stripHeighteningHTML(html));
    return /\bchoose\s+(?:a\s+listed\s+battle\s+form|between\b[^.!?]*\b(?:form|elemental)\b|[^.!?]{0,80}\bbattle\s+form)\b/i.test(text);
}

export function compileChoiceVariantSelection(effects, adapted) {
    if ((effects ?? []).length < 2 || !hasExplicitFormChoice(adapted.descriptionHTML)) return null;
    const base = baseReference(effects[0]?.reference);
    if (!base || effects.some(effect =>
        baseReference(effect.reference) !== base || effect.reference === base)) return null;

    const recipients = new Set(effects.map(effect => effect.recipient?.actor));
    if (recipients.size !== 1 || !["source", "target"].includes([...recipients][0])) return null;

    const branches = effects.map(effect => ({
        choiceId: choiceId(optionLabel(effect)),
        label: optionLabel(effect),
        effectUuid: effect.uuid,
        nativeConfigurationRequired: effect.document?.automation?.requiresConfiguration === true
    }));
    if (branches.some(branch => !branch.choiceId)
        || new Set(branches.map(branch => branch.choiceId)).size !== branches.length) return null;

    const selectorId = `${base}:explicit-choice`;
    return {
        effects: effects.map((effect, index) => ({
            ...effect,
            scope: "choice-variant",
            trigger: { event: "use", timing: "after-choice", once: true },
            selectorId,
            choiceId: branches[index].choiceId,
            triggerAnalysis: { status: "compiled", evidence: "explicit-form-choice" }
        })),
        selectors: [{
            id: selectorId,
            selector: "explicit-choice",
            prompt: "select-one",
            timing: "before-application",
            required: true,
            exclusive: true,
            allowCancel: true,
            applicationRequiresConfirmation: true,
            branches
        }]
    };
}

export function compileChoiceVariantResolution(adapted, nativeEffects, outcomes) {
    const outcomeApplications = Object.values(nativeEffects.outcomes ?? {})
        .reduce((total, effects) => total + effects.length, 0);
    const eligible = adapted.defense.kind === "none"
        && adapted.damageComponents.length === 0
        && nativeEffects.choiceVariants.length >= 2
        && nativeEffects.choiceSelectors.length === 1
        && nativeEffects.onUse.length === 0
        && nativeEffects.deferred.length === 0
        && nativeEffects.rankVariants.length === 0
        && nativeEffects.unscoped.length === 0
        && outcomeApplications === 0;
    if (!eligible) return null;

    const analyses = nativeEffects.choiceVariants.map(effect => {
        const termination = (nativeEffects.terminations ?? [])
            .find(candidate => candidate.id === effect.terminationId) ?? null;
        return analyzeNativeEffectCompleteness(adapted, effect, termination, { choiceResolved: true });
    });
    const blockers = [...new Set([
        ...analyses.flatMap(analysis => analysis.blockers),
        ...nativeEffects.choiceVariants
            .filter(effect => effect.document?.automation?.ruleKeys?.includes("Aura"))
            .map(() => "aura-reminder-runtime")
    ])];
    const complete = blockers.length === 0;
    const selector = nativeEffects.choiceSelectors[0];
    return {
        resolution: {
            kind: "effect-choice",
            check: null,
            sharedDamage: null,
            outcomes,
            postDamageTerminal: null,
            selector,
            applications: nativeEffects.choiceVariants.map(effect => ({
                kind: "native-spell-effect",
                uuid: effect.uuid,
                source: "nativeEffects.choiceVariants",
                choiceId: effect.choiceId,
                ...(effect.terminationId ? { terminationId: effect.terminationId } : {})
            }))
        },
        automation: {
            level: complete ? "prompted" : "guided",
            confidence: complete ? 1 : 0.75,
            compiledCapabilities: [
                "source",
                "targeting",
                "explicit-choice-selection",
                "native-spell-effect-on-use"
            ],
            pendingCapabilities: blockers.map(blocker => `choice-variant:${blocker}`)
        },
        completeness: { complete, blockers, requiresInteraction: true }
    };
}
