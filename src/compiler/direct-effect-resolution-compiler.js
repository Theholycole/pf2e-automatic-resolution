import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

function hasAny(keys, candidates) {
    return candidates.some(candidate => keys.has(candidate));
}

function addUnsupportedSignal(blockers, present, supported, name) {
    if (present && !supported) blockers.push(name);
}

export function analyzeNativeEffectCompleteness(adapted, effect, termination = null, options = {}) {
    const profile = effect.document?.automation ?? null;
    const keys = new Set(profile?.ruleKeys ?? []);
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML))
        .replace(effect.sourceText, "")
        .trim();
    const blockers = [];

    if (!profile) blockers.push("effect-document-not-audited");
    if (profile && keys.size === 0) blockers.push("effect-has-no-rule-elements");
    if (/@Damage\[/i.test(text)) blockers.push("inline-damage");
    if (/\b\d+d\d+\s+(?:[a-z]+\s+)?damage\b/i.test(text)) blockers.push("description-damage");
    if (/@Check\[/i.test(text)) blockers.push("inline-check");
    if (/@Template\[/i.test(text)) blockers.push("inline-template");
    if (/\b(?:at the gm'?s discretion|as determined by the gm)\b/i.test(text)) blockers.push("gm-adjudication");
    if (/\bDismiss\b/i.test(text) && !termination) blockers.push("dismissal");
    blockers.push(...(termination?.blockers ?? []));
    if (/\bcounteract\b/i.test(text)) blockers.push("counteract");
    if (/\b(?:recover from|flat check)\b/i.test(text)) blockers.push("recovery-check");
    if (/\b(?:can't cast this spell if|must have space|spell is lost)\b/i.test(text)) blockers.push("prerequisite-or-placement");

    addUnsupportedSignal(blockers,
        /@UUID\[Compendium\.pf2e\.actionspf2e\./i.test(text),
        keys.has("GrantItem"),
        "referenced-action");
    addUnsupportedSignal(blockers,
        /@UUID\[Compendium\.pf2e\.conditionitems\./i.test(text),
        hasAny(keys, ["GrantItem", "Immunity", "BattleForm"]),
        "condition-interaction");
    addUnsupportedSignal(blockers,
        /\btemporarily immune\b/i.test(text),
        keys.has("GrantItem"),
        "temporary-immunity");
    addUnsupportedSignal(blockers,
        /\b(?:choose|choice|pick one|pick two|random)\b/i.test(text),
        profile?.requiresConfiguration === true || options.choiceResolved === true,
        "choice-resolution");
    addUnsupportedSignal(blockers,
        /\b(?:as a|spend(?:ing)?)\s+(?:single|one|two|three|\d+)[ -]actions?\b|\bcan take the\b[^.!?]*\baction\b|\brequires?\s+(?:an?\s+)?(?:Interact\s+)?action\b/i.test(text),
        keys.has("GrantItem"),
        "granted-or-follow-up-action");
    addUnsupportedSignal(blockers,
        /\bafter which the spell ends\b|\bspell ends after\b/i.test(text),
        profile?.removesAfterRoll === true,
        "consumption-timing");

    return {
        complete: blockers.length === 0,
        blockers: [...new Set(blockers)],
        requiresConfiguration: profile?.requiresConfiguration === true
    };
}

export function compileDirectEffectResolution(adapted, nativeEffects, outcomes) {
    const outcomeApplications = Object.values(nativeEffects.outcomes ?? {})
        .reduce((total, effects) => total + effects.length, 0);
    const eligible = adapted.defense.kind === "none"
        && adapted.damageComponents.length === 0
        && nativeEffects.onUse.length === 1
        && (nativeEffects.deferred?.length ?? 0) === 0
        && (nativeEffects.sequences?.length ?? 0) === 0
        && nativeEffects.unscoped.length === 0
        && outcomeApplications === 0;
    if (!eligible) return null;

    const effect = nativeEffects.onUse[0];
    const termination = (nativeEffects.terminations ?? [])
        .find(candidate => candidate.id === effect.terminationId) ?? null;
    const completeness = analyzeNativeEffectCompleteness(adapted, effect, termination);
    const level = completeness.complete
        ? completeness.requiresConfiguration ? "prompted" : "automatic"
        : "guided";

    return {
        resolution: {
            kind: "effect",
            check: null,
            sharedDamage: null,
            outcomes,
            postDamageTerminal: null,
            applications: [{
                kind: "native-spell-effect",
                uuid: effect.uuid,
                source: "nativeEffects.onUse",
                ...(effect.terminationId ? { terminationId: effect.terminationId } : {})
            }]
        },
        automation: {
            level,
            confidence: completeness.complete ? 1 : 0.75,
            compiledCapabilities: [
                "source",
                "targeting",
                "direct-effect-resolution",
                "native-spell-effect-on-use"
            ],
            pendingCapabilities: completeness.blockers.map(blocker => `direct-effect:${blocker}`)
        },
        completeness
    };
}
