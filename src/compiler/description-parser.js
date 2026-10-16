import { DEGREES } from "./constants.js";
import { extractNativeSpellEffectLinks } from "./native-spell-effect-compiler.js";
import { normalizeSlug } from "./normalize.js";
import { listLifetimeFor, parseConditionLists } from "./condition-list-lifetime.js";

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

/** HTML as one line of plain text. */
export function plainText(html) {
    return htmlToPlainText(html).replace(/\s+/g, " ").trim();
}

/** A stated duration ("10 minutes", "1 hour"; rounds too when allowed) in seconds, or null. */
export function durationSeconds(text, { rounds = false } = {}) {
    const match = /^(\d+) (round|minute|hour)s?$/i.exec(String(text ?? "").trim());
    if (!match || (!rounds && /round/i.test(match[2]))) return null;
    return Number(match[1]) * { round: 6, minute: 60, hour: 3600 }[match[2].toLowerCase()];
}

/** Plain text split into sentences (a sentence may start with an @-link). */
export function splitSentences(text) {
    return text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
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

// Attitudes (PF2e files them with the conditions) aren't conditions the module applies: an attitude change is the GM's to play,
// so it becomes a note Effect (user decision), never a condition.
const ATTITUDES = new Set(["hostile", "unfriendly", "indifferent", "friendly", "helpful"]);

export function extractConditionReferences(html) {
    const references = [];
    for (const match of String(html ?? "").matchAll(CONDITION_REFERENCE)) {
        const reference = match[1].trim();
        const label = (match[2] ?? reference).trim();
        const name = label.replace(/\s+\d+\s*$/, "").trim() || reference;
        if (ATTITUDES.has(normalizeSlug(name))) continue;
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

// A repeated predicate starts a new condition clause. A duration after that
// predicate belongs to the later condition, while a simple "A and B for ..."
// construction keeps the shared duration.
export function conditionClauseBounds(text, start, end) {
    const source = String(text ?? "");
    const sentence = sentenceBounds(source, start, end);
    const offset = sentence.left + 1;
    const boundaries = [...source.slice(offset, sentence.right)
        .matchAll(/(?:,\s*)?\band\s+(?:is|are|becomes?|gains?|become|gain)\b/gi)]
        .map(match => offset + (match.index ?? 0));
    return {
        start: boundaries.filter(index => index < start).at(-1) ?? offset,
        end: boundaries.find(index => index >= end) ?? sentence.right
    };
}

function extractTextConditionReferences(text, catalog) {
    const references = [];
    for (const entry of catalog ?? []) {
        const name = entry.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // ("… awakens Fatigued, …": Nightmare's.)
        const pattern = new RegExp(`\\b(?:is|becomes?|become|gains?|be|awakens)\\s+(?:also\\s+)?${name}(?:\\s+(\\d+))?\\b`, "gi");
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
    // An unlinked affirmative prone predicate is a condition grant. Prone has
    // no timed expiry, since the target can Stand to remove it.
    const pronePredicates = [
        /\band (?:is|are) forced to (?:its|their) knees, (becoming prone)(?=[.!?]|$)/gi,
        // ("The target falls prone and is encumbered for 1 round.": Prone, then the row's other condition.)
        /\b(?:the target|the creature|it|they) (falls prone)(?=[.!?]|$| and (?:is|takes)\b)/gi,
        /\band (falls prone)(?=[.!?]|$)/gi,
        /\b(?:is|are) (knocked prone)(?=[,;.!?]|$)/gi
    ];
    for (const pattern of pronePredicates) for (const match of String(text ?? "").matchAll(pattern)) {
        const index = (match.index ?? 0) + match[0].indexOf(match[1]);
        references.push({
            kind: "condition", slug: "prone", name: "Prone", value: null,
            duration: { mode: "unlimited", value: null, unit: null },
            source: "description-text", reference: null, raw: match[1],
            index, end: index + match[1].length
        });
    }
    return references;
}

export function extractScopedConditionReferences(html, catalog = []) {
    const plain = htmlToPlainText(html);
    const linked = extractConditionReferences(plain);
    const listItems = parseConditionLists(plain);
    const textReferences = extractTextConditionReferences(plain, catalog);
    // A plain condition continuing a coordinated grant ("Stunned 1, and
    // enfeebled 2") is a grant even when no verb directly precedes it.
    const listReferences = listItems
        .filter(item => !item.raw.startsWith("@UUID")
            && ![...linked, ...textReferences].some(reference => listLifetimeFor(reference, [item])))
        .map(item => ({
            kind: "condition",
            slug: normalizeSlug(item.slug),
            name: item.slug.replace(/(^|-)([a-z])/g, (_match, separator, letter) => `${separator}${letter.toUpperCase()}`),
            value: item.value,
            duration: null,
            source: "description-list",
            reference: null,
            raw: item.raw,
            index: item.index,
            end: item.end
        }));
    const references = [...linked, ...textReferences, ...listReferences]
        .filter((entry, index, all) => all.findIndex(candidate =>
            candidate.slug === entry.slug && candidate.value === entry.value
        ) === index);
    const durations = extractDurationCandidates(plain);

    return references.map(reference => {
        const item = listLifetimeFor(reference, listItems);
        // Only a written (own or shared) lifetime, or the self-limiting valued
        // Stunned rule, is authoritative. Otherwise keep the clause heuristics.
        if (item && (item.lifetime || (item.slug === "stunned" && item.value != null) || item.slug === "prone")) {
            const lifetime = item.lifetime;
            return {
                ...reference,
                // Prone without its own timer lasts until the creature Stands.
                duration: lifetime?.duration ?? (item.slug === "prone" ? { mode: "unlimited", value: null, unit: null } : null),
                lifetimeProof: {
                    listIndex: item.listIndex,
                    text: lifetime?.text ?? null,
                    shared: !!lifetime && !item.ownLifetime,
                    escape: lifetime?.escape === true,
                    escapeDC: lifetime?.escapeDC ?? null,
                    ...(lifetime?.escapeCheck ? { escapeCheck: lifetime.escapeCheck } : {}),
                    actionEnd: lifetime?.actionEnd ?? null,
                    spellEnds: lifetime?.spellEnds === true
                }
            };
        }
        const { end } = conditionClauseBounds(plain, reference.index, reference.end);
        // "frightened 3 and fleeing for 1 round": a self-limiting Frightened or Sickened doesn't take a timer written
        // after another condition of the same list (that timer is the later condition's).
        const selfLimiting = ["frightened", "sickened"].includes(reference.slug) && reference.value != null;
        const candidates = durations
            .filter(candidate => candidate.index >= reference.end && candidate.end <= end)
            .filter(candidate => !selfLimiting || !references.some(other => other !== reference && other.index >= reference.end && other.end <= candidate.index))
            .sort((a, b) => distanceBetween(reference.index, reference.end, a.index, a.end)
                - distanceBetween(reference.index, reference.end, b.index, b.end));
        return { ...reference, duration: candidates[0]?.duration ?? reference.duration ?? null };
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

export function inferDamageMultiplier(text, components = []) {
    // "you regain Hit Points equal to half the damage the target takes" measures a benefit, not the row's damage.
    const plain = String(text ?? "").replace(/\bequal to (?:half )?(?:the )?(?:[a-z]+ )?damage\b[^.;]*/gi, "");
    if (/\b(?:unaffected|no damage)\b/i.test(plain)) return 0;
    if (/\bhalf (?:the )?damage\b/i.test(plain)) return 0.5;
    const typedHalf = /^\s*(?:the (?:target|creature)|it|they) takes? half the ([a-z][a-z-]*) damage\.?\s*$/i.exec(plain);
    if (typedHalf && components.length === 1
        && components[0].type?.toLowerCase() === typedHalf[1].toLowerCase()
        && components[0].kinds?.includes("damage")
        && !components[0].category) return 0.5;
    // "The target takes half the force damage and half the healing reduction." / "… the full force damage and …": the spell's one entry,
    // named by its type.
    const typed = /\btakes? (half|the full) (?:the )?([a-z][a-z-]*) damage\b/i.exec(plain);
    if (typed && components.length === 1 && components[0].type?.toLowerCase() === typed[2].toLowerCase() && components[0].kinds?.includes("damage") && !components[0].category)
        return typed[1].toLowerCase() === "half" ? 0.5 : 1;
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
