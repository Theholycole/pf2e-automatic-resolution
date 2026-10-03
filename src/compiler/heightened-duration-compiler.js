import { htmlToPlainText } from "./description-parser.js";

// "Heightened (7th) The duration increases to 1 hour.": a fixed-rank entry that replaces the spell's duration from
// that rank on. PF2e keeps no heightened duration in the spell data, so the Effect route has to set it itself.

const MAX_RANK = 10;
const UNIT = Object.freeze({ round: "rounds", minute: "minutes", hour: "hours", day: "days" });
const EFFECT_KINDS = new Set(["effect", "effect-variant", "effect-choice", "effect-sequence"]);
const SPELL_DURATION = "\\b(?:the\\s+)?(?:spell'?s\\s+)?duration(?:\\s+of\\s+(?:the|this)\\s+spell)?\\s+";
// ("This spell has a duration of 8 hours." too.)
const FIXED_CHANGE = new RegExp("(?:\\bincrease\\s+the\\s+duration\\s+to|" + SPELL_DURATION + "(?:increases\\s+to|becomes|is)|\\bthe\\s+effects?\\s+lasts?\\s+for|\\bthe\\s+spell\\s+lasts(?:\\s+for)?|\\bthis\\s+spell\\s+has\\s+a\\s+duration\\s+of)\\s+(\\d+)\\s+(round|minute|hour|day|week|month)s?\\s*(?=[.,;]|\\s+and\\b|$)", "gi");
// "The duration is until the next time you make your daily preparations": PF2e's own Effects write it as 1 day
// (or 24 hours, or unlimited), so that is what the created Effect gets.
const DAILY_CHANGE = new RegExp(SPELL_DURATION + "(?:increases(?:\\s+to)?|becomes|is|lasts)\\s+(?:(?:to\\s+)?last(?:ing|s)?\\s+)?until\\s+(?:the\\s+next\\s+time\\s+you\\s+(?:next\\s+)?(?:make|do)|you\\s+next\\s+(?:make|do)|your\\s+next)\\s+(?:your\\s+)?daily\\s+preparations\\b", "gi");
const DAILY_DURATION = Object.freeze({ value: 1, unit: "days" });
// "The symbol remains until the next time you make your daily preparations." / "The spell lasts until …": the same, said of the thing.
const REMAINS_DAILY = /\bThe\s+(?:spell|(?!duration\b)[a-z]+)\s+(?:remains|lasts)\s+until\s+(?:the\s+next\s+time\s+you\s+(?:next\s+)?(?:make|do)|you\s+next\s+(?:make|do)|your\s+next)\s+(?:your\s+)?daily\s+preparations\b/gi;
// Any other wording that changes the duration ("increases to lasting until …", "is unlimited", "the duration of
// familiar form increases …", "Increase the duration to 1 day"). Mentions like "during the spell's duration" don't.
const CHANGE_MENTION = /\bdurations?\b(?:\s+of\s+[a-z' ]{1,40}?)?\s+(?:increases?|becomes?|is|lasts|changes?|to)\b|\b(?:increase|change)s?\s+(?:the\s+)?(?:spell'?s\s+)?duration\b|\b(?:unlimited|infinite)\s+duration\b|\bwithout\s+a\s+duration\b/gi;

function heighteningBlocks(html) {
    const source = String(html ?? "");
    const heads = [...source.matchAll(/<strong\b[^>]*>\s*Heightened\s*\(([^)]*)\)\s*<\/strong>/gi)];
    return heads.map((head, index) => {
        const fixed = head[1].match(/^\s*(\d+)(?:st|nd|rd|th)\s*$/i);
        return {
            label: head[1].trim(),
            rank: fixed ? Number(fixed[1]) : null,
            text: htmlToPlainText(source.slice((head.index ?? 0) + head[0].length, heads[index + 1]?.index ?? source.length))
        };
    });
}

/**
 * The spell's duration changes by cast rank, from its Heightened entries.
 * @returns {null | {entries: Array<{minRank, value, unit, raw}>, unsupported: Array<{rank, raw}>}}
 */
// "Heightened (+1) The duration increases by 1 day.": with the spell's rank and fixed duration known, one entry per step.
const STEP_CHANGE = /^(?:The|the)\s+(?:spell'?s\s+)?duration\s+increases\s+by\s+(\d+)\s+(round|minute|hour|day)s?\.$/;

// "Heightened (8th) The duration is unlimited.": only a note reads it (an unlimited note); other routes keep it unsupported.
// (Cryostasis: "The duration becomes unlimited, and the ice block's Hit Points increase by 20." — the rest is the note's text.)
const UNLIMITED_CHANGE = /^(?:The|the)\s+(?:spell'?s\s+)?duration\s+(?:is|becomes)\s+unlimited(?:,\s+and\s+the\s+[a-z' ]+\s+Hit\s+Points\s+increase\s+by\s+\d+)?\.$/;

export function parseHeightenedDurations(html, { baseRank = null, baseDuration = null, unlimited = false } = {}) {
    const entries = [];
    const unsupported = [];
    for (const block of heighteningBlocks(html)) {
        if (unlimited && block.rank !== null && UNLIMITED_CHANGE.test(block.text.trim())) {
            entries.push({ minRank: block.rank, value: null, unit: "unlimited", mode: "unlimited", raw: block.text.trim() });
            continue;
        }
        const step = /^\+(\d+)$/.exec(block.label) && STEP_CHANGE.exec(block.text.trim());
        if (step && Number.isInteger(baseRank) && baseDuration?.mode === "fixed" && Number.isInteger(baseDuration.value)
            && baseDuration.unit === UNIT[step[2].toLowerCase()]) {
            const interval = Number(/^\+(\d+)$/.exec(block.label)[1]);
            for (let rank = baseRank + interval, times = 1; rank <= MAX_RANK; rank += interval, times += 1)
                entries.push({ minRank: rank, value: baseDuration.value + times * Number(step[1]), unit: baseDuration.unit, raw: step[0] });
            continue;
        }
        // "The duration of the deafened condition increases by 2 rounds" is the condition's own, not the spell's.
        const text = block.text.replace(/\bthe\s+duration\s+of\s+the\s+[a-z ]{1,30}?\s+condition\b/gi, "the condition");
        const fixed = [...text.matchAll(FIXED_CHANGE), ...text.matchAll(DAILY_CHANGE), ...text.matchAll(REMAINS_DAILY)];
        const mentions = [...text.matchAll(CHANGE_MENTION)];
        if (!fixed.length && !mentions.length) continue;
        const sentence = (fixed[0] ?? mentions[0])[0].trim();
        // A (+N) interval entry, several durations in one entry, or a change this rule doesn't read.
        const covered = mention => fixed.some(match => mention.index >= match.index && mention.index < match.index + match[0].length);
        if (block.rank === null || fixed.length !== 1 || !mentions.every(covered)) {
            unsupported.push({ rank: block.rank, label: block.label, raw: text });
            continue;
        }
        // (A week is 7 days and a month 30, in days: PF2e's Effects have no longer unit.)
        const long = { week: 7, month: 30 }[String(fixed[0][2] ?? "").toLowerCase()];
        entries.push(fixed[0][1]
            ? long ? { minRank: block.rank, value: Number(fixed[0][1]) * long, unit: "days", raw: sentence }
                : { minRank: block.rank, value: Number(fixed[0][1]), unit: UNIT[fixed[0][2].toLowerCase()], raw: sentence }
            : { minRank: block.rank, ...DAILY_DURATION, mode: "daily-preparations", raw: sentence });
    }
    if (!entries.length && !unsupported.length) return null;
    entries.sort((left, right) => left.minRank - right.minRank);
    return { entries, unsupported };
}

/** The heightened duration at a cast rank, or null when the spell's own duration applies. */
export function heightenedDurationAt(entries, castRank) {
    return (entries ?? []).filter(entry => entry.minRank <= Number(castRank)).at(-1) ?? null;
}

function sameDuration(duration, candidate) {
    return Number(duration?.value) === Number(candidate?.value) && duration?.unit === candidate?.unit;
}

/** Whether an Effect template already lasts the heightened duration (PF2e writes daily preparations as a day). */
function templateLasts(template, expected) {
    if (expected.mode !== "daily-preparations") return sameDuration(template, expected);
    return template?.unit === "unlimited" || sameDuration(template, DAILY_DURATION) || sameDuration(template, { value: 24, unit: "hours" });
}

function applicationEffect(plan, application) {
    const collection = {
        "nativeEffects.onUse": plan.nativeEffects?.onUse,
        "nativeEffects.rankVariants": plan.nativeEffects?.rankVariants,
        "nativeEffects.choiceVariants": plan.nativeEffects?.choiceVariants
    }[application.source] ?? [];
    return collection.find(effect => effect.uuid === application.uuid
        && (!application.choiceId || effect.choiceId === application.choiceId)
        && (!application.rankRange || (effect.rankRange?.minRank === application.rankRange.minRank
            && effect.rankRange?.maxRank === application.rankRange.maxRank))) ?? null;
}

/**
 * Where an Effect-route plan's Effect template can't carry the heightened duration: each application gets
 * `heightenedDuration` rank branches that override the created Effect's duration. An Effect whose template
 * already states the heightened duration (a separate heightened Effect chosen by rank) needs none. A rank
 * the plan can't honour leaves the plan guided.
 */
export function attachHeightenedDurations(plan, adapted, sourceHTML) {
    const parsed = parseHeightenedDurations(sourceHTML, { baseRank: plan.rank, baseDuration: plan.lifecycle?.durationSpec });
    if (!parsed) return;
    if (parsed.entries.length) plan.lifecycle.heightenedDurations = parsed.entries.map(entry => ({ ...entry }));
    if (!EFFECT_KINDS.has(plan.resolution?.kind)) return;
    const blockers = [];
    if (parsed.unsupported.length) blockers.push("heightened-duration:unparsed");
    const base = plan.lifecycle.durationSpec;
    if (parsed.entries.length && (base?.mode !== "fixed" || plan.lifecycle.sustained)) blockers.push("heightened-duration:base-not-fixed");
    if (parsed.entries.length && plan.resolution.kind === "effect-sequence") blockers.push("heightened-duration:sequence");
    const applications = plan.resolution.applications ?? [];
    for (const application of blockers.length ? [] : applications) {
        const effect = applicationEffect(plan, application);
        const template = effect?.document?.mechanics?.duration;
        const minRank = Math.max(plan.rank, application.rankRange?.minRank ?? plan.rank);
        const maxRank = Math.min(MAX_RANK, application.rankRange?.maxRank ?? MAX_RANK);
        const branches = [];
        for (let rank = minRank; rank <= maxRank; rank += 1) {
            const expected = heightenedDurationAt(parsed.entries, rank);
            if (!expected || templateLasts(template, expected)) continue;
            // Only an Effect that mirrors the spell's base duration may be stretched to the heightened one.
            if (!template || template.sustained || !sameDuration(template, base)) {
                blockers.push("heightened-duration:effect-duration-mismatch");
                break;
            }
            const last = branches.at(-1);
            if (last && last.maxRank === rank - 1 && sameDuration(last, expected)) last.maxRank = rank;
            else branches.push({ minRank: rank, maxRank: rank, value: expected.value, unit: expected.unit, raw: expected.raw });
        }
        if (!branches.length) continue;
        if (branches.at(-1).maxRank === MAX_RANK && application.rankRange?.maxRank == null) branches.at(-1).maxRank = null;
        application.heightenedDuration = { template: { value: template.value, unit: template.unit }, branches };
    }
    if (blockers.length) {
        plan.automation.pendingCapabilities.push(...blockers);
        for (const application of applications) delete application.heightenedDuration;
        if (["automatic", "prompted"].includes(plan.automation.level)) {
            plan.automation.level = "guided";
            plan.automation.confidence = Math.min(plan.automation.confidence ?? 0.75, 0.75);
        }
        return;
    }
    plan.automation.compiledCapabilities.push("heightened-duration");
}
