// Recurring saves as a condition lifetime: "It can attempt a new save at the
// end of each of its turns to end the confusion", or "At the end of each of its
// turns, it can attempt a new Will save to reduce the remaining duration by 1
// round, or end it entirely on a critical success". The clause must be a whole
// sentence of the outcome and name its scope exactly; anything else stays
// residual. A later "with no save to end early" removes an inherited recurring
// save from that degree only.

const STATISTIC = String.raw`(?:(Will|Fortitude|Reflex)\s+)?`;
const SUBJECT = String.raw`(?:It|it|The target|the target|The creature|the creature)`;

// Noun forms that name exactly one PF2e condition.
const CONDITION_NOUNS = Object.freeze({
    confusion: "confused",
    paralysis: "paralyzed",
    blindness: "blinded",
    deafness: "deafened",
    fascination: "fascinated"
});

const END_NAMED = new RegExp(String.raw`^${SUBJECT} can attempt a new ${STATISTIC}save at the end of each of its turns to end the ([a-z]+)\.$`);
const END_NAMED_CONDITION = new RegExp(String.raw`^${SUBJECT} can attempt a new ${STATISTIC}save at the end of each of its turns to end (?:the|its) ([a-z]+) condition\.$`);
const REDUCE = new RegExp(String.raw`^At the end of each of its turns, ${SUBJECT} can attempt a (?:new )?${STATISTIC}save to reduce the remaining duration by 1 round,? or end it entirely on a critical success\.$`);
const NEGATION = /\b(?:with no save|(?:gets|receives) no save) to end (?:the effect |the condition |it )?early\b/i;

function sentences(text) {
    return String(text ?? "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
}

function statisticMatches(named, statistic) {
    return !named || named.toLowerCase() === String(statistic ?? "").toLowerCase();
}

/** Parse the recurring-save sentence of one outcome, if exactly one exists. */
export function parseRecurringSave(text, {statistic} = {}) {
    const found = [];
    for (const sentence of sentences(text)) {
        let match = END_NAMED.exec(sentence) ?? END_NAMED_CONDITION.exec(sentence);
        if (match) {
            const slug = CONDITION_NOUNS[match[2].toLowerCase()] ?? (END_NAMED_CONDITION.test(sentence) ? match[2].toLowerCase() : null);
            found.push({mode: "end", slug, statisticNamed: match[1] ?? null, sourceText: sentence});
            continue;
        }
        match = REDUCE.exec(sentence);
        if (match) found.push({mode: "reduce", slug: null, statisticNamed: match[1] ?? null, sourceText: sentence});
    }
    if (found.length !== 1) return found.length ? {ambiguous: true} : null;
    const [clause] = found;
    if (!statisticMatches(clause.statisticNamed, statistic)) return {ambiguous: true, reason: "statistic-mismatch"};
    if (clause.mode === "end" && !clause.slug) return {ambiguous: true, reason: "unknown-condition-noun"};
    return {timing: "turn-end", mode: clause.mode, slug: clause.slug, statistic: String(statistic).toLowerCase(), sourceText: clause.sourceText};
}

/**
 * Attach a proven recurring save to the conditions it governs. "End the
 * confusion" scopes to that one condition; "reduce the remaining duration"
 * scopes to every condition of the outcome, which must share one fixed rounds
 * timer. Returns false when the sentence exists but its scope is unproven.
 */
export function attachRecurringSave(outcome, {statistic} = {}) {
    const parsed = parseRecurringSave(outcome.rawText, {statistic});
    if (!parsed) return true;
    if (parsed.ambiguous) return false;
    const effects = outcome.effects ?? [];
    let scoped;
    if (parsed.mode === "end") {
        scoped = effects.filter(effect => effect.slug === parsed.slug);
        if (scoped.length !== 1) return false;
    } else {
        scoped = effects;
        const timers = new Set(scoped.map(effect => JSON.stringify([effect.duration?.mode, effect.duration?.value, effect.duration?.unit])));
        if (!scoped.length || timers.size !== 1 || scoped[0].duration?.mode !== "fixed"
            || scoped[0].duration.unit !== "rounds" || !Number.isInteger(Number(scoped[0].duration.value))) return false;
    }
    // (A condition lasting the sustained spell — "Confused for the spell's duration" — can still end early on the save.)
    const spellLifetime = effect => parsed.mode === "end" && Array.isArray(effect.endsWhen) && effect.endsWhen.length === 1 && effect.endsWhen[0].event === "spell-ended";
    if (scoped.some(effect => effect.whileCondition || (effect.endsWhen && !spellLifetime(effect)))) return false;
    const recurringSave = {timing: parsed.timing, mode: parsed.mode, statistic: parsed.statistic, sourceText: parsed.sourceText};
    for (const effect of scoped) effect.recurringSave = {...recurringSave};
    return true;
}

/** "with no save to end early" removes an inherited recurring save. */
export function applyRecurringNegation(outcome) {
    if (!sentences(outcome.rawText).some(sentence => NEGATION.test(sentence))) return false;
    for (const effect of outcome.effects ?? []) delete effect.recurringSave;
    outcome.noRecurringSave = true;
    return true;
}

export const RECURRING_NEGATION = NEGATION;
