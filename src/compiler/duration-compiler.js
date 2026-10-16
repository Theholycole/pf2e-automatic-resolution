import { conditionClauseBounds, extractDurationCandidates } from "./description-parser.js";

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
    // ("until the end of your target's next turn", Commanding Lash: the target's.)
    const match = source.match(/until (?:the )?(start|beginning|end) of (your target'?s|your|the target'?s|its|their) (next )?turn/i);
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
    // A sustained spell with no listed duration can be Sustained for up to 10 minutes (Player Core's rule for Sustain).
    if (!raw && sustained) {
        return { mode: "sustained", maximum: { ...fixedDuration("10 minutes"), ruleDefault: true }, endsWhen: [{ event: "sustain-ended" }], raw };
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
    const { start, end } = conditionClauseBounds(source, index, effect.end ?? index);
    return source.slice(start, end).trim();
}

export function compileEffectDuration(effect, text, lifecycle) {
    if (effect.whileCondition) return effect;
    const sentence = sentenceAround(text, effect).replace(/[’]/g, "'");
    const endsWhen = [];
    let duration = effect.duration ? { mode: "fixed", ...effect.duration } : null;
    // A positional list proof is authoritative for timers and Escape. It must
    // not borrow a later clause's duration or another condition's Escape text.
    const proof = effect.lifetimeProof ?? null;

    if (!duration && !proof) {
        const localEffectIndex = Math.max(
            sentence.indexOf(effect.raw ?? ""),
            sentence.toLowerCase().indexOf(String(effect.name ?? "").toLowerCase())
        );
        const candidates = extractDurationCandidates(sentence);
        const candidate = candidates.find(entry => entry.index >= localEffectIndex)
            ?? (/^until\b/i.test(sentence) ? candidates[0] : null);
        // "Frightened 3 and Fleeing for 1 round": a self-limiting condition (PF2e lowers Frightened each turn and ends
        // Sickened by retching) doesn't take a timer written after another condition in its list.
        const rawAt = effect.raw ? sentence.indexOf(effect.raw) : -1;
        const afterEffect = rawAt >= 0 ? rawAt + effect.raw.length : localEffectIndex + String(effect.name ?? "").length;
        const between = candidate && localEffectIndex >= 0 ? sentence.slice(afterEffect, candidate.index) : "";
        const laterCondition = /@UUID\[Compendium\.pf2e\.conditionitems\.|\band (?:is )?(?:blinded|clumsy|confused|dazzled|deafened|drained|enfeebled|fascinated|fatigued|fleeing|grabbed|immobilized|off-guard|paralyzed|prone|restrained|slowed|stunned|stupefied|unconscious)\b/i.test(between);
        if (candidate && !(["frightened", "sickened"].includes(effect.slug) && laterCondition)) duration = { mode: "fixed", ...candidate.duration };
    }
    // "permanently", "for an unlimited duration": the condition has no timer (it's removed by other means).
    if (!proof && /\bpermanent(?:ly)?\b/i.test(sentence)) duration = { mode: "unlimited", value: null, unit: null };
    // "… Blinded for an unlimited duration": only the condition the phrase follows (up to the next condition link).
    if (!proof) {
        const at = effect.raw ? sentence.indexOf(effect.raw) : -1;
        const after = at >= 0 ? sentence.slice(at + effect.raw.length) : "";
        const own = after.split(/@UUID\[/)[0];
        if (/^[^.]*?\bfor an unlimited duration\b/i.test(own)) duration = { mode: "unlimited", value: null, unit: null };
    }
    // "Stupefied 1 for [[/r 1d4 #rounds]]{1d4 rounds}" / "Stupefied 2 for 1d4 rounds": rounds rolled for each creature;
    // only the condition the phrase directly follows.
    if (!proof && effect.raw) {
        const at = sentence.indexOf(effect.raw);
        const rolled = at >= 0 ? /^ for (?:\[\[\/g?m?r (\d+d\d+)(?: #rounds)?\]\]\{\1 rounds\}|(\d+d\d+) rounds)(?=[.,;]|$)/.exec(sentence.slice(at + effect.raw.length)) : null;
        if (rolled) duration = { mode: "fixed", value: null, valueRoll: rolled[1] ?? rolled[2], unit: "rounds", expiry: "turn-start", anchor: "effect-start", sourceText: rolled[0].trim() };
    }
    if (!proof && /\bfor (?:the|this) spell'?s duration\b|\bfor the duration of (?:the|this) spell\b/i.test(sentence)) {
        duration = lifecycle?.durationSpec ?? { mode: "spell", raw: "spell duration" };
        endsWhen.push({ event: "spell-ended" });
    }
    // A bare "for the duration" in a spell with a fixed duration is that duration.
    if (!proof && !duration && /\bfor the duration\b(?! of)/i.test(sentence) && lifecycle?.durationSpec?.mode === "fixed") {
        const { value, unit, expiry, anchor } = lifecycle.durationSpec;
        duration = { mode: "fixed", value, unit, expiry: expiry ?? null, anchor: anchor ?? "effect-start", sourceText: "for the duration" };
    }
    if (!proof && /\b(?:as long as|while) (?:you )?(?:sustain|are sustaining)|\bas long as (?:the|this) spell is sustained\b/i.test(sentence)) {
        duration = lifecycle?.durationSpec ?? { mode: "sustained", raw: "while sustained" };
        endsWhen.push({ event: "sustain-ended" });
    }
    // Rest: "until it next gets eight hours of rest" ends it; "decreasing these conditions by 1 for each eight hours of
    // rest it gets" lowers it at each rest. No timer.
    if (!proof && /\buntil (?:it|the target|the creature|they) next gets? (?:eight|8) hours of rest\b/i.test(sentence)) endsWhen.push({ event: "rest", mode: "end" });
    else if (!proof && /\bdecreasing (?:these|this|the) conditions? by 1 for each (?:eight|8) hours of rest (?:it|they) gets?\b/i.test(sentence)) endsWhen.push({ event: "rest", mode: "decrement" });
    // "… is also Blinded for its next action": only the condition the phrase directly follows; the bearer's next action ends it.
    if (!proof && effect.raw) {
        const at = sentence.indexOf(effect.raw);
        if (at >= 0 && /^ for (?:its|their) next action(?=[.,;]|$)/.test(sentence.slice(at + effect.raw.length))) endsWhen.push({ event: "action", action: "next" });
    }
    if (proof?.escape) endsWhen.push({ event: "escape", dc: proof.escapeDC ?? "spell", ...(proof.escapeCheck ? { check: proof.escapeCheck } : {}) });
    if (proof?.actionEnd) endsWhen.push({ event: "action", action: proof.actionEnd });
    if (proof ? proof.spellEnds : /\b(?:until|or) (?:the|this) spell ends?\b/i.test(sentence)) endsWhen.push({ event: "spell-ended" });
    // "The target is fascinated by the cloud.": the condition lasts as long as the area does (not ended by leaving it).
    if (!proof && effect.raw) {
        const at = sentence.indexOf(effect.raw);
        if (at >= 0 && /^ by the (?:cloud|area)(?=[.,;]|$)/.test(sentence.slice(at + effect.raw.length))) endsWhen.push({ event: "area-ended" });
    }
    const leaveArea = [/\bwhile in (?:the|this) (?:area|cloud)\b/i, /\b(?:while|as long as) (?:it|the target|the creature|they) (?:is |are )?(?:within|in|remains? in) (?:the|this) (?:area|cloud)\b/i,
        /\buntil (?:it|the target|the creature|they) leaves? (?:the|this) (?:area|cloud)\b/i];
    if (!proof && leaveArea.some(pattern => pattern.test(sentence))) {
        // A condition with its own way to end (Sickened's retching, Frightened's decrease each turn) keeps it when another condition stands
        // between it and the phrase: "Sickened 1 and Slowed 1 while in the cloud" limits the Slowed; "Encumbered and Slowed 1 while in the
        // area" limits both.
        const ownRecovery = ["sickened", "frightened"].includes(effect.slug);
        const at = ownRecovery && effect.raw ? sentence.indexOf(effect.raw) : -1;
        const tail = at >= 0 ? sentence.slice(at + effect.raw.length) : "";
        const phrase = Math.min(...leaveArea.map(pattern => { const found = pattern.exec(tail); return found ? found.index : Infinity; }));
        if (!(at >= 0 && Number.isFinite(phrase) && /@UUID\[Compendium\.pf2e\.conditionitems\./.test(tail.slice(0, phrase)))) endsWhen.push({ event: "leave-area" });
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
