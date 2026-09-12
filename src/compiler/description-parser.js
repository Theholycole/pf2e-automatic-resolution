import { DEGREES } from "./constants.js";
import { extractNativeSpellEffectLinks } from "./native-spell-effect-compiler.js";
import { normalizeSlug } from "./normalize.js";

const DEGREE_HEADING = /<strong\b[^>]*>\s*(Critical\s+Success|Critical\s+Failure|Success|Failure)\s*<\/strong>/gi;
const CONDITION_REFERENCE = /@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([^\]]+)\](?:\{([^}]+)\})?/gi;

const DEGREE_BY_HEADING = Object.freeze({
    "critical success": "criticalSuccess",
    success: "success",
    failure: "failure",
    "critical failure": "criticalFailure"
});

function decodeEntities(text) {
    return String(text ?? "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#0*39;|&apos;/gi, "'")
        .replace(/&#(\d+);/g, (_match, value) => String.fromCodePoint(Number(value)));
}

export function htmlToPlainText(html) {
    return decodeEntities(String(html ?? "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p\s*>/gi, "\n")
        .replace(/<\/li\s*>/gi, "\n")
        .replace(/<hr\b[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " "))
        .replace(/[\t\r ]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

export function stripHeighteningHTML(html) {
    const source = String(html ?? "");
    const match = /<strong\b[^>]*>\s*Heightened\s*\(/i.exec(source);
    return match ? source.slice(0, match.index) : source;
}

function normalizeDegreeHeading(heading) {
    return DEGREE_BY_HEADING[String(heading).toLowerCase().replace(/\s+/g, " ")] ?? null;
}

function nextSemanticBlock(source, start, limit) {
    const tail = source.slice(start, limit);
    const boundary = /<hr\b[^>]*>|<(?:p|li|h[1-6])\b[^>]*>\s*<strong\b/i.exec(tail);
    return boundary ? start + boundary.index : limit;
}

export function extractDegreeSections(html) {
    const source = stripHeighteningHTML(html);
    const matches = [...source.matchAll(DEGREE_HEADING)];
    const sections = {};

    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const degree = normalizeDegreeHeading(match[1]);
        if (!degree || sections[degree]) continue;
        const limit = matches[index + 1]?.index ?? source.length;
        const end = nextSemanticBlock(source, match.index + match[0].length, limit);
        const sectionHTML = source.slice(match.index + match[0].length, end);
        sections[degree] = {
            degree,
            html: sectionHTML,
            text: htmlToPlainText(sectionHTML),
            explicit: true,
            omittedFrom: null
        };
    }

    if (!sections.criticalSuccess && sections.success) {
        sections.criticalSuccess = {
            ...sections.success,
            degree: "criticalSuccess",
            explicit: false,
            omittedFrom: "success"
        };
    }
    if (!sections.criticalFailure && sections.failure) {
        sections.criticalFailure = {
            ...sections.failure,
            degree: "criticalFailure",
            explicit: false,
            omittedFrom: "failure"
        };
    }

    return sections;
}

function conditionValue(label) {
    const match = String(label ?? "").match(/\b(\d+)\b/);
    return match ? Number(match[1]) : null;
}

export function extractConditionReferences(html) {
    const references = [];
    for (const match of String(html ?? "").matchAll(CONDITION_REFERENCE)) {
        const reference = match[1].trim();
        const label = (match[2] ?? reference).trim();
        const name = label.replace(/\s+\d+\s*$/, "").trim() || reference;
        references.push({
            kind: "condition",
            slug: normalizeSlug(name),
            name,
            value: conditionValue(label),
            duration: null,
            source: "description-reference",
            reference,
            raw: match[0],
            index: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length
        });
    }

    return references.filter((entry, index, all) => all.findIndex(candidate =>
        candidate.slug === entry.slug && candidate.value === entry.value
    ) === index);
}

const NUMBER_WORDS = Object.freeze({
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
});

export function extractDurationCandidates(text) {
    const source = String(text ?? "");
    const candidates = [];
    const fixed = /\bfor\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(rounds?|minutes?|hours?|days?|weeks?)\b/gi;
    for (const match of source.matchAll(fixed)) {
        const rawUnit = match[2].toLowerCase();
        const unit = rawUnit.replace(/s$/, "") + "s";
        candidates.push({
            index: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
            duration: {
                value: Number(match[1]) || NUMBER_WORDS[match[1].toLowerCase()],
                unit,
                expiry: unit === "rounds" ? "turn-start" : null,
                anchor: "effect-start",
                sourceText: match[0]
            }
        });
    }

    const subject = "(its|their|your|the target'?s|the creature'?s)";
    const beforeTurn = new RegExp(`\\buntil\\s+(?:the\\s+)?(start|beginning|end)\\s+of\\s+${subject}\\s+(next\\s+)?turn\\b`, "gi");
    for (const match of source.matchAll(beforeTurn)) {
        candidates.push({
            index: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
            duration: {
                value: 1,
                unit: "rounds",
                expiry: match[1].toLowerCase() === "end" ? "turn-end" : "turn-start",
                anchor: match[2].toLowerCase() === "your" ? "source-turn" : "target-turn",
                offset: match[3] ? 1 : 0,
                sourceText: match[0]
            }
        });
    }

    const afterTurn = new RegExp(`\\buntil\\s+${subject}\\s+(next\\s+)?turn\\s+(begins?|starts?|ends?)\\b`, "gi");
    for (const match of source.matchAll(afterTurn)) {
        candidates.push({
            index: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
            duration: {
                value: 1,
                unit: "rounds",
                expiry: /^ends?$/i.test(match[3]) ? "turn-end" : "turn-start",
                anchor: match[1].toLowerCase() === "your" ? "source-turn" : "target-turn",
                offset: match[2] ? 1 : 0,
                sourceText: match[0]
            }
        });
    }
    return candidates.sort((left, right) => left.index - right.index);
}

function distanceBetween(leftStart, leftEnd, rightStart, rightEnd) {
    if (leftEnd < rightStart) return rightStart - leftEnd;
    if (rightEnd < leftStart) return leftStart - rightEnd;
    return 0;
}

function sentenceBounds(text, start, end) {
    const boundaries = [...String(text ?? "").matchAll(/[.!?](?=\s+[A-Z@]|\s*$)|\n/g)].map(match => match.index ?? 0);
    const left = boundaries.filter(index => index < start).at(-1) ?? -1;
    const right = boundaries.find(index => index >= end) ?? String(text ?? "").length;
    return { left, right };
}

function extractTextConditionReferences(text, catalog) {
    const references = [];
    for (const entry of catalog ?? []) {
        const name = entry.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`\\b(?:is|becomes?|become|gains?|be)\\s+(?:also\\s+)?${name}(?:\\s+(\\d+))?\\b`, "gi");
        for (const match of String(text ?? "").matchAll(pattern)) {
            references.push({
                kind: "condition",
                slug: entry.slug,
                name: entry.name,
                value: match[1] ? Number(match[1]) : null,
                duration: null,
                source: "description-text",
                reference: null,
                raw: match[0],
                index: match.index ?? 0,
                end: (match.index ?? 0) + match[0].length
            });
        }
    }
    return references;
}

export function extractScopedConditionReferences(html, catalog = []) {
    const plain = htmlToPlainText(html);
    const linked = extractConditionReferences(plain);
    const references = [...linked, ...extractTextConditionReferences(plain, catalog)]
        .filter((entry, index, all) => all.findIndex(candidate =>
            candidate.slug === entry.slug && candidate.value === entry.value
        ) === index);
    const durations = extractDurationCandidates(plain);

    return references.map(reference => {
        const { left, right } = sentenceBounds(plain, reference.index, reference.end);
        const candidates = durations
            .filter(candidate => candidate.index >= reference.end && candidate.end <= right)
            .sort((a, b) => distanceBetween(reference.index, reference.end, a.index, a.end)
                - distanceBetween(reference.index, reference.end, b.index, b.end));
        return { ...reference, duration: candidates[0]?.duration ?? null };
    });
}

export function extractInlineExpressions(source, marker) {
    const text = String(source ?? "");
    const expressions = [];
    let cursor = 0;

    while (cursor < text.length) {
        const start = text.indexOf(marker, cursor);
        if (start < 0) break;
        const bodyStart = start + marker.length;
        let depth = 1;
        let end = bodyStart;
        for (; end < text.length && depth > 0; end += 1) {
            if (text[end] === "[") depth += 1;
            else if (text[end] === "]") depth -= 1;
        }
        if (depth !== 0) break;
        const labelMatch = /^\{([^}]*)\}/.exec(text.slice(end));
        const expressionEnd = labelMatch ? end + labelMatch[0].length : end;
        expressions.push({
            marker,
            body: text.slice(bodyStart, end - 1),
            label: labelMatch?.[1]?.trim() || null,
            raw: text.slice(start, expressionEnd),
            index: start,
            end: expressionEnd
        });
        cursor = expressionEnd;
    }

    return expressions;
}

export function extractPersistentDamageExpressions(source) {
    const text = String(source ?? "");
    const inline = extractInlineExpressions(text, "@Damage[");
    const occupied = inline.map(expression => [expression.index, expression.end]);
    const expressions = [];
    const pattern = /\b(\d+(?:d\d+)?)\s+persistent\s+([a-z][a-z-]*)\s+damage\b/gi;
    for (const match of text.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (occupied.some(([start, end]) => index >= start && index < end)) continue;
        expressions.push({
            formula: `${match[1]}[persistent,${match[2].toLowerCase()}]`,
            source: "description-text",
            raw: match[0],
            index,
            end: index + match[0].length
        });
    }
    return expressions;
}

export function inferDamageMultiplier(text) {
    const plain = String(text ?? "");
    if (/\b(?:unaffected|no damage)\b/i.test(plain)) return 0;
    if (/\bhalf (?:the )?damage\b/i.test(plain)) return 0.5;
    if (/\b(?:full|normal) damage\b/i.test(plain)) return 1;
    if (/\b(?:double|twice) (?:the )?damage\b/i.test(plain)) return 2;
    return null;
}

export function analyzeDescription(html) {
    const source = String(html ?? "");
    const sections = extractDegreeSections(source);
    const linkedConditionReferences = extractConditionReferences(source);
    const conditionCatalog = [...new Map(linkedConditionReferences.map(reference => [
        reference.slug,
        { slug: reference.slug, name: reference.name }
    ])).values()];
    const sectionConditions = Object.fromEntries(DEGREES.map(degree => [
        degree,
        extractScopedConditionReferences(sections[degree]?.html ?? "", conditionCatalog)
    ]));
    const inlineChecks = extractInlineExpressions(source, "@Check[").length;
    const inlineDamage = extractInlineExpressions(source, "@Damage[").length;

    return {
        sections,
        sectionCount: Object.keys(sections).length,
        explicitSectionCount: Object.values(sections).filter(section => section.explicit).length,
        inheritedSections: Object.fromEntries(Object.entries(sections)
            .filter(([, section]) => section.omittedFrom)
            .map(([degree, section]) => [degree, section.omittedFrom])),
        sectionConditions,
        allConditionReferences: linkedConditionReferences,
        inlineChecks,
        inlineDamage,
        spellEffectReferences: extractNativeSpellEffectLinks(source),
        actionReferences: [...source.matchAll(/@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.([^\]]+)\]/gi)]
            .map(match => match[1]),
        templates: [...source.matchAll(/@Template\[([^\]]+)\]/gi)].map(match => match[1]),
        hasArrivalDeparture: /<strong\b[^>]*>\s*Arrive\s*<\/strong>/i.test(source)
            && /<strong\b[^>]*>\s*Depart\s*<\/strong>/i.test(source),
        hasAfflictionBlock: /\((?:disease|poison)\)[\s\S]{0,500}<strong\b[^>]*>\s*(?:Stage\s+\d+|Saving Throw|Maximum Duration)\b/i.test(source)
            || /<strong\b[^>]*>\s*(?:Stage\s+\d+|Saving Throw|Maximum Duration)\b/i.test(source)
    };
}
