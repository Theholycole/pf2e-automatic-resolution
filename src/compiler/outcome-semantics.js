function normalizedText(text) {
    return String(text ?? "").replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
}

export function inferTerminalResult(text, { conditionalScopeClaimed = false } = {}) {
    const normalized = normalizedText(text).toLowerCase();
    if (!conditionalScopeClaimed
        && /\b(?:if|unless|when|whenever)\b[^.!?;]*\b(?:dies|killed)\b/i.test(normalized)) {
        return null;
    }
    if (/\b(?:it|the target|target|creature)\s+(?:is reduced to 0 (?:hp|hit points) and )?dies\b/.test(normalized)
        || /\b(?:killed|dies) instantly\b/.test(normalized)) {
        // ("It is reduced to 0 Hit Points and dies": its Hit Points too.)
        return { kind: "death", label: "Dies", automatic: true, ...(/\bis reduced to 0 (?:hp|hit points) and dies\b/.test(normalized) ? { zeroHp: true } : {}) };
    }
    return null;
}

export function inferPostDamageTerminal(text) {
    const normalized = normalizedText(text).toLowerCase();
    const reducedToZero = /\bif\s+(?:the\s+)?target\s+is\s+reduced\s+to\s+0\s+(?:hp|hit points)\s+by\s+(?:this|the)\s+spell\b/i;
    const terminal = /\b(?:kills?\s+(?:it|the target)\s+instantly|(?:it|the target)\s+dies(?:\s+instantly)?)\b/i;
    const sourceDamageKills = /\bif the damage from [^.!?]+ reduces a creature to 0 (?:hp|hit points),? that creature dies instantly\b/i;
    const thisDamageKills = /\bif (?:this|the spell'?s) damage reduces (?:the )?(?:target|creature) to 0 (?:hp|hit points),? (?:it|the target|the creature) dies(?: immediately| instantly)?\b/i;
    if (sourceDamageKills.test(normalized) || thisDamageKills.test(normalized)
        || (reducedToZero.test(normalized) && terminal.test(normalized))) {
        return {
            kind: "death",
            label: "Dies at 0 HP",
            threshold: 0,
            requiresReductionBySource: true,
            automatic: true
        };
    }
    return null;
}

const MANUAL_SEMANTICS = Object.freeze([
    ["forced-movement", /\b(?:pushed?|pulled?|moved?)\b[^.!?]*(?:feet|square)|\bteleport(?:ed|ation)?\b/i],
    ["action-restriction", /\b(?:can't|cannot) (?:use (?:(?:concentrate|manipulate) )?(?:actions?|reactions?)|(?:Stand|Stride|Step|Fly|Escape)\b)|\bmust use (?:all|its|their|the first) actions?\b/i],
    ["gm-choice", /\b(?:as determined by the gm|gm's discretion|you choose|of your choice|choose one)\b/i],
    ["secondary-save", /\b(?:must|has to) (?:also )?(?:attempt|make|succeed at) (?:an? )?(?:additional )?(?:(?:fortitude|reflex|will)|@Check\[(?:fortitude|reflex|will))[^.!?]*(?:save|saving throw)\b/i],
    ["temporary-immunity", /\btemporarily immune\b/i],
    ["terrain", /\b(?:difficult terrain|hazardous terrain|clear(?:ed)? (?:a |the )?(?:square|area)|solid barriers?)\b/i],
    ["counteract", /\bcounteract\b/i],
    ["attitude-or-hostility", /\b(?:attitude|hostile actions?|friendly|helpful|unfriendly)\b/i],
    ["transformation-or-form", /\b(?:transformed?|polymorph|battle form|animal form)\b/i],
    ["anatomy", /\b(?:head|limbs?|anatomy|decapitat)\b/i],
    ["summoning", /\b(?:summon|conjure)\b/i],
    ["perception-or-illusion", /\b(?:illusion|disbelieve|perception check|can see|can't see|cannot see)\b/i],
    ["condition-floor", /\b(?:can't|cannot) (?:reduce|be reduced)[^.!?]*below\b/i],
    ["conditional-effect", /\b(?:if|unless|whenever)\b/i]
]);

export function classifyManualSemantics(text) {
    const normalized = normalizedText(text);
    return MANUAL_SEMANTICS
        .filter(([, pattern]) => pattern.test(normalized))
        .map(([kind]) => ({ kind, text: normalized }));
}
