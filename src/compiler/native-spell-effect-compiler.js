import { DEGREES } from "./constants.js";

export const NATIVE_SPELL_EFFECT_UUID_PREFIX = "Compendium.pf2e.spell-effects.Item.";
const RAW_LINK = /@UUID\[(Compendium\.pf2e\.spell-effects\.Item\.([^\]]+))\](?:\{([^}]+)\})?/gi;
const ENRICHED_LINK = /<a\b[^>]*data-uuid=["'](Compendium\.pf2e\.spell-effects\.Item\.([^"']+))["'][^>]*>([\s\S]*?)<\/a>/gi;

function plainLabel(value) {
    return String(value ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function uniqueBy(values, selector) {
    const seen = new Set();
    return values.filter(value => {
        const key = selector(value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function extractNativeSpellEffectLinks(html) {
    const source = String(html ?? "");
    const links = [];
    for (const pattern of [RAW_LINK, ENRICHED_LINK]) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
            const index = match.index ?? 0;
            const reference = match[2].trim();
            links.push({
                kind: "native-spell-effect",
                uuid: match[1].trim(),
                reference,
                label: plainLabel(match[3]) || reference,
                raw: match[0],
                index,
                end: index + match[0].length,
                source: "description-link"
            });
        }
    }
    return uniqueBy(links.sort((left, right) => left.index - right.index), link => `${link.index}:${link.uuid}`);
}

export function degreesFromNativeEffectLabel(value) {
    let text = String(value ?? "");
    const degrees = [];
    if (/\bcritical success\b/i.test(text)) degrees.push("criticalSuccess");
    if (/\bcritical failure\b/i.test(text)) degrees.push("criticalFailure");
    text = text.replace(/\bcritical success\b|\bcritical failure\b/gi, " ");
    if (/\bsuccess\b/i.test(text)) degrees.push("success");
    if (/\bfailure\b/i.test(text)) degrees.push("failure");
    return DEGREES.filter(degree => degrees.includes(degree));
}

function catalogEntry(catalog, reference) {
    if (catalog instanceof Map) return catalog.get(reference) ?? null;
    if (catalog && typeof catalog === "object") return catalog[reference] ?? null;
    return null;
}

function recipientForOutcome(sectionText, fullText, hasPrimarySave) {
    const text = String(sectionText ?? "");
    if (/\byou\s+(?:gain|are|become|take|receive|have)\b/i.test(text)) {
        return { actor: "source", evidence: "outcome-source-language" };
    }
    if (/\bif\b[^.!?]{0,100}\b(?:kills?|dies?)\b[^.!?]{0,100}\byou\s+gain\b/i.test(fullText)) {
        return { actor: "source", evidence: "source-benefit-on-outcome" };
    }
    if (/\b(?:the target|target|the creature|creature|enemy|ally|it|they)\s+(?:gains?|is|becomes?|takes?|receives?|has)\b/i.test(text)) {
        return { actor: "target", evidence: "outcome-target-language" };
    }
    if (hasPrimarySave) return { actor: "target", evidence: "primary-save-target" };
    return { actor: "manual", evidence: "recipient-not-explicit" };
}

function recipientForUnscoped(target, fullText) {
    const structuredTarget = String(target ?? "").trim();
    if (/^(?:you|yourself|self)(?: only)?$/i.test(structuredTarget)) {
        return { actor: "source", evidence: "structured-self-target" };
    }
    if (/\b(?:object|weapon|club|staff|food|liquid|structure|hazard|door|container|corpse|item)\b/i.test(structuredTarget)) {
        return { actor: "manual", evidence: "non-actor-target" };
    }
    if (structuredTarget) return { actor: "target", evidence: "structured-target" };
    if (/\byou\s+(?:gain|are|become|take|receive|have)\b/i.test(fullText)) {
        return { actor: "source", evidence: "source-language" };
    }
    return { actor: "manual", evidence: "recipient-not-explicit" };
}

function compileReference(link, { catalog, recipient, scope, degrees = [] }) {
    const entry = catalogEntry(catalog, link.reference);
    const catalogWasProvided = catalog instanceof Map || (catalog && typeof catalog === "object");
    return {
        kind: link.kind,
        uuid: link.uuid,
        // Installed PF2e packs canonicalize source-name UUIDs to document IDs.
        // Preserve the rendered label, but restore the official document name
        // for semantic grouping such as rank, choice, and immunity sequences.
        reference: entry?.name ?? link.reference,
        label: link.label,
        recipient,
        scope,
        degrees: [...degrees],
        application: "create-embedded-effect",
        applicationRequiresConfirmation: true,
        source: link.source,
        sourceText: link.raw,
        document: entry ? {
            id: entry.id ?? entry._id ?? null,
            name: entry.name ?? link.reference,
            type: entry.type ?? null,
            sourceFile: entry.sourceFile ?? null,
            automation: entry.automation ?? null,
            mechanics: entry.mechanics ?? null,
            ...(entry.badge ? { badge: entry.badge } : {})
        } : null,
        resolutionStatus: entry ? "resolved" : catalogWasProvided ? "unresolved" : "runtime"
    };
}

function sectionContainsNoEffect(section) {
    return /^\s*(?:you\s+gain\s+)?no\s+(?:additional\s+)?effect\b/i.test(String(section?.text ?? ""));
}

function inheritedDegree(text) {
    const match = String(text ?? "").match(/^\s*As (?:a )?(critical success|critical failure|success|failure)\b/i);
    if (!match) return null;
    return {
        "critical success": "criticalSuccess",
        "critical failure": "criticalFailure",
        success: "success",
        failure: "failure"
    }[match[1].toLowerCase()] ?? null;
}

export function compileNativeSpellEffects({
    html,
    sections = {},
    targeting = {},
    hasPrimarySave = false,
    catalog = null
} = {}) {
    const links = extractNativeSpellEffectLinks(html);
    const sectionLinks = Object.fromEntries(DEGREES.map(degree => [
        degree,
        extractNativeSpellEffectLinks(sections[degree]?.html ?? "")
    ]));
    const outcomes = Object.fromEntries(DEGREES.map(degree => [degree, []]));
    const unscoped = [];
    const fullText = plainLabel(html);

    for (const link of links) {
        const labeledDegrees = degreesFromNativeEffectLabel(`${link.reference} ${link.label}`);
        const physicalDegrees = DEGREES.filter(degree => sectionLinks[degree].some(candidate => candidate.uuid === link.uuid)
            && !sectionContainsNoEffect(sections[degree]));
        const degrees = [...new Set([...physicalDegrees, ...labeledDegrees])];

        if (degrees.length > 0) {
            for (const degree of degrees) {
                const recipient = recipientForOutcome(sections[degree]?.text, fullText, hasPrimarySave);
                outcomes[degree].push(compileReference(link, {
                    catalog,
                    recipient,
                    scope: "outcome",
                    degrees
                }));
            }
        } else {
            unscoped.push(compileReference(link, {
                catalog,
                recipient: recipientForUnscoped(targeting.target, fullText),
                scope: "unscoped"
            }));
        }
    }

    for (const degree of DEGREES) {
        outcomes[degree] = uniqueBy(outcomes[degree], effect => effect.uuid);
    }
    for (const degree of DEGREES) {
        const inherited = inheritedDegree(sections[degree]?.text);
        if (!inherited || inherited === degree) continue;
        outcomes[degree] = uniqueBy([
            ...outcomes[degree],
            ...outcomes[inherited].map(effect => ({
                ...effect,
                degrees: [...new Set([...effect.degrees, degree])]
            }))
        ], effect => effect.uuid);
    }

    return {
        references: links,
        outcomes,
        unscoped: uniqueBy(unscoped, effect => effect.uuid),
        resolvedCount: links.filter(link => catalogEntry(catalog, link.reference)).length,
        unresolvedCount: catalog ? links.filter(link => !catalogEntry(catalog, link.reference)).length : 0
    };
}
