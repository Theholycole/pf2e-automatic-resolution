import { analyzeNativeEffectCompleteness } from "./direct-effect-resolution-compiler.js";
import { htmlToPlainText } from "./description-parser.js";

function baseReference(reference) {
    return String(reference ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function rankFromVariantLabel(reference) {
    const match = String(reference ?? "").match(/\((\d+)(?:st|nd|rd|th)\s+(?:rank|level)\)/i);
    return match ? Number(match[1]) : null;
}

function heighteningBlocks(html) {
    const source = String(html ?? "");
    const matches = [...source.matchAll(/<strong\b[^>]*>\s*Heightened\s*\((\d+)(?:st|nd|rd|th)\)\s*<\/strong>/gi)];
    return matches.map((match, index) => ({
        rank: Number(match[1]),
        index: match.index ?? 0,
        html: source.slice(match.index ?? 0, matches[index + 1]?.index ?? source.length)
    }));
}

function variantThreshold(html, base, variant) {
    const labeledRank = rankFromVariantLabel(variant.reference);
    if (labeledRank) return { rank: labeledRank, evidence: "effect-label-rank" };

    const blocks = heighteningBlocks(html);
    const variantIndex = String(html ?? "").indexOf(variant.sourceText);
    const baseIndex = String(html ?? "").indexOf(base.sourceText);
    const containing = blocks.filter(block => block.index > baseIndex && block.index < variantIndex).at(-1);
    if (containing) return { rank: containing.rank, evidence: "heightened-block-link" };

    if (/\b(?:rounds?|minutes?|hours?|days?)\b/i.test(variant.reference)) {
        const durationBlock = blocks.find(block => /\bduration\b/i.test(htmlToPlainText(block.html)));
        if (durationBlock) return { rank: durationBlock.rank, evidence: "heightened-duration-block" };
    }
    return null;
}

function recipientBranches(adapted) {
    const changesByRank = new Map([{
        minRank: adapted.rank,
        actor: adapted.targeting.target ? "target" : "source",
        evidence: adapted.targeting.target ? "base-structured-target" : "base-self-target"
    }].map(change => [change.minRank, change]));
    for (const [rankText, adjustment] of Object.entries(adapted.heightening?.levels ?? {})) {
        const minRank = Number(rankText);
        const target = adjustment?.target?.value;
        if (!Number.isInteger(minRank) || minRank <= adapted.rank || typeof target !== "string") continue;
        changesByRank.set(minRank, {
            minRank,
            actor: target.trim() ? "target" : "source",
            evidence: "fixed-heightening-target"
        });
    }
    const ordered = [...changesByRank.values()]
        .sort((left, right) => left.minRank - right.minRank)
        .reduce((branches, change) => {
            if (branches.at(-1)?.actor !== change.actor) branches.push(change);
            return branches;
        }, []);
    return ordered.map((change, index) => ({
        ...change,
        maxRank: ordered[index + 1] ? ordered[index + 1].minRank - 1 : null
    }));
}

export function compileRankVariantSelection(effects, adapted) {
    if ((effects ?? []).length !== 2) return null;
    const base = effects.find(effect => effect.reference === baseReference(effect.reference));
    const variant = effects.find(effect => effect !== base);
    if (!base || !variant || baseReference(base.reference) !== baseReference(variant.reference)) return null;

    const threshold = variantThreshold(adapted.descriptionHTML, base, variant);
    if (!threshold || threshold.rank <= adapted.rank) return null;
    const recipients = recipientBranches(adapted);
    const selectorId = `${baseReference(base.reference)}:cast-rank`;
    const effectBranches = [
        { minRank: adapted.rank, maxRank: threshold.rank - 1, effectUuid: base.uuid },
        { minRank: threshold.rank, maxRank: null, effectUuid: variant.uuid }
    ];
    const dynamicRecipient = recipients.length > 1;
    const compileEffect = (effect, branch) => ({
        ...effect,
        scope: "rank-variant",
        recipient: dynamicRecipient
            ? { actor: "rank-dependent", selector: "cast-rank", branches: recipients }
            : { actor: recipients[0].actor, evidence: recipients[0].evidence },
        trigger: { event: "use", timing: "after-activation", once: true },
        selectorId,
        rankRange: { minRank: branch.minRank, maxRank: branch.maxRank },
        triggerAnalysis: {
            status: "compiled",
            evidence: threshold.evidence
        }
    });

    return {
        effects: [
            compileEffect(base, effectBranches[0]),
            compileEffect(variant, effectBranches[1])
        ],
        selectors: [{
            id: selectorId,
            selector: "cast-rank",
            exclusive: true,
            exhaustive: true,
            branches: effectBranches,
            recipientBranches: recipients
        }]
    };
}

export function compileRankVariantResolution(adapted, nativeEffects, outcomes) {
    const outcomeApplications = Object.values(nativeEffects.outcomes ?? {})
        .reduce((total, effects) => total + effects.length, 0);
    const eligible = adapted.defense.kind === "none"
        && adapted.damageComponents.length === 0
        && nativeEffects.rankVariants.length === 2
        && nativeEffects.variantSelectors.length === 1
        && nativeEffects.onUse.length === 0
        && nativeEffects.deferred.length === 0
        && nativeEffects.unscoped.length === 0
        && outcomeApplications === 0;
    if (!eligible) return null;

    const analyses = nativeEffects.rankVariants.map(effect => {
        const termination = (nativeEffects.terminations ?? [])
            .find(candidate => candidate.id === effect.terminationId) ?? null;
        return analyzeNativeEffectCompleteness(adapted, effect, termination);
    });
    const blockers = [...new Set(analyses.flatMap(analysis => analysis.blockers))];
    const complete = blockers.length === 0;
    const requiresConfiguration = analyses.some(analysis => analysis.requiresConfiguration);
    const level = complete ? requiresConfiguration ? "prompted" : "automatic" : "guided";
    const selector = nativeEffects.variantSelectors[0];
    return {
        resolution: {
            kind: "effect-variant",
            check: null,
            sharedDamage: null,
            outcomes,
            postDamageTerminal: null,
            selector,
            applications: nativeEffects.rankVariants.map(effect => ({
                kind: "native-spell-effect",
                uuid: effect.uuid,
                source: "nativeEffects.rankVariants",
                rankRange: effect.rankRange,
                ...(effect.terminationId ? { terminationId: effect.terminationId } : {})
            }))
        },
        automation: {
            level,
            confidence: complete ? 1 : 0.75,
            compiledCapabilities: [
                "source",
                "targeting",
                "rank-variant-selection",
                "native-spell-effect-on-use"
            ],
            pendingCapabilities: blockers.map(blocker => `rank-variant:${blocker}`)
        },
        completeness: { complete, blockers, requiresConfiguration }
    };
}
