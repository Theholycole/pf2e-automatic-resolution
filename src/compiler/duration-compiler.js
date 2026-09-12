import { extractDurationCandidates } from "./description-parser.js";

const UNIT = Object.freeze({
    round: "rounds",
    rounds: "rounds",
    minute: "minutes",
    minutes: "minutes",
    hour: "hours",
    hours: "hours",
    day: "days",
    days: "days",
    week: "weeks",
    weeks: "weeks",
    month: "months",
    months: "months",
    year: "years",
    years: "years"
});

function fixedDuration(text) {
    const direct = String(text ?? "").trim().match(/^(?:up to\s+)?(\d+)\s+(rounds?|minutes?|hours?|days?|weeks?|months?|years?)\b/i);
    if (!direct) return null;
    const unit = UNIT[direct[2].toLowerCase()];
    return {
        mode: "fixed",
        value: Number(direct[1]),
        unit,
        expiry: unit === "rounds" ? "turn-start" : null,
        anchor: "effect-start",
        maximum: /^up to\b/i.test(text)
    };
}

function turnBoundary(text) {
    const source = String(text ?? "");
    const match = source.match(/until (?:the )?(start|beginning|end) of (your|the target'?s|its|their) (next )?turn/i);
    if (!match) return null;
    return {
        mode: "turn-boundary",
        value: 1,
        unit: "rounds",
        expiry: match[1].toLowerCase() === "end" ? "turn-end" : "turn-start",
        anchor: match[2].toLowerCase() === "your" ? "source-turn" : "target-turn",
        offset: match[3] ? 1 : 0
    };
}

export function compileItemDuration(value, { sustained = false } = {}) {
    const raw = String(value ?? "").trim();
    const normalized = raw.toLowerCase();
    if (!raw && sustained) {
        return { mode: "sustained", maximum: null, endsWhen: [{ event: "sustain-ended" }], raw };
    }
    if (!raw) return { mode: "instantaneous", raw };
    if (/\bunlimited\b/.test(normalized)) return { mode: "unlimited", raw };
    if (/daily preparations/.test(normalized)) {
        return { mode: "daily-preparations", anchor: /target'?s/.test(normalized) ? "target" : "source", raw };
    }
    const boundary = turnBoundary(raw);
    if (boundary) return { ...boundary, raw };
    const sustainedExtension = raw.match(/^(\d+\s+(?:rounds?|minutes?|hours?))\s+or\s+sustained\s+up to\s+(\d+\s+(?:rounds?|minutes?|hours?))$/i);
    if (sustainedExtension) {
        return {
            mode: "sustained",
            base: fixedDuration(sustainedExtension[1]),
            maximum: fixedDuration(sustainedExtension[2]),
            endsWhen: [{ event: "sustain-ended" }],
            raw
        };
    }
    const fixed = fixedDuration(raw.replace(/^sustained\s+/i, ""));
    if (sustained || /^sustained\b/i.test(normalized)) {
        return {
            mode: "sustained",
            maximum: fixed,
            endsWhen: [{ event: "sustain-ended" }],
            raw
        };
    }
    if (fixed && /\bor\s+\d+\s+(?:rounds?|minutes?|hours?|days?|weeks?)\b/i.test(raw)) {
        return { mode: "choice", optionsText: raw, raw };
    }
    if (fixed) {
        const endsWhen = [];
        if (/\bor until expended\b/i.test(raw)) endsWhen.push({ event: "expended" });
        if (/\bor until used\b/i.test(raw)) endsWhen.push({ event: "used" });
        if (/\bor until discharged\b/i.test(raw)) endsWhen.push({ event: "discharged" });
        return {
            ...fixed,
            ...(endsWhen.length ? { endsWhen, expirationMode: "first" } : {}),
            raw
        };
    }
    return { mode: "text", raw };
}

function sentenceAround(text, effect) {
    const source = String(text ?? "");
    const index = effect.index ?? source.toLowerCase().indexOf(String(effect.name ?? "").toLowerCase());
    const boundaries = [...source.matchAll(/[.!?](?=\s+[A-Z@]|\s*$)|\n/g)].map(match => match.index ?? 0);
    const start = (boundaries.filter(boundary => boundary < index).at(-1) ?? -1) + 1;
    const end = (boundaries.find(boundary => boundary >= (effect.end ?? index)) ?? source.length - 1) + 1;
    return source.slice(start, end).trim();
}

export function compileEffectDuration(effect, text, lifecycle) {
    if (effect.whileCondition) return effect;
    const sentence = sentenceAround(text, effect).replace(/[’]/g, "'");
    const endsWhen = [];
    let duration = effect.duration ? { mode: "fixed", ...effect.duration } : null;

    if (!duration) {
        const localEffectIndex = Math.max(
            sentence.indexOf(effect.raw ?? ""),
            sentence.toLowerCase().indexOf(String(effect.name ?? "").toLowerCase())
        );
        const candidates = extractDurationCandidates(sentence);
        const candidate = candidates.find(entry => entry.index >= localEffectIndex)
            ?? (/^until\b/i.test(sentence) ? candidates[0] : null);
        if (candidate) duration = { mode: "fixed", ...candidate.duration };
    }
    if (/\bpermanent(?:ly)?\b/i.test(sentence)) duration = { mode: "unlimited", value: null, unit: null };
    if (/\bfor (?:the|this) spell'?s duration\b|\bfor the duration of (?:the|this) spell\b/i.test(sentence)) {
        duration = lifecycle?.durationSpec ?? { mode: "spell", raw: "spell duration" };
        endsWhen.push({ event: "spell-ended" });
    }
    if (/\b(?:as long as|while) (?:you )?(?:sustain|are sustaining)|\bas long as (?:the|this) spell is sustained\b/i.test(sentence)) {
        duration = lifecycle?.durationSpec ?? { mode: "sustained", raw: "while sustained" };
        endsWhen.push({ event: "sustain-ended" });
    }
    if (/\buntil (?:it|the target|the creature|they) (?:Escapes?|escape)\b/i.test(sentence)) {
        endsWhen.push({ event: "escape" });
    }
    if (/\b(?:until|or) (?:the|this) spell ends?\b/i.test(sentence)) endsWhen.push({ event: "spell-ended" });
    if (/\bwhile in (?:the|this) (?:area|cloud)\b/i.test(sentence)
        || /\b(?:while|as long as) (?:it|the target|the creature|they) (?:is |are )?(?:within|in|remains? in) (?:the|this) (?:area|cloud)\b/i.test(sentence)
        || /\buntil (?:it|the target|the creature|they) leaves? (?:the|this) (?:area|cloud)\b/i.test(sentence)) {
        endsWhen.push({ event: "leave-area" });
    }

    if (!duration && endsWhen.length === 0) return effect;
    return {
        ...effect,
        duration,
        ...(effect.endsWhen || endsWhen.length ? {
            endsWhen: [...(effect.endsWhen ? [effect.endsWhen] : []), ...endsWhen]
        } : {}),
        expirationMode: duration && endsWhen.length ? "first" : duration ? "duration" : "event"
    };
}
