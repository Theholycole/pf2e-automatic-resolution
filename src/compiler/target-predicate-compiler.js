function normalizedTarget(text) {
    return String(text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function compileActorTargetConstraints(targeting, {
    requiresActorTargets = false,
    descriptionHTML = ""
} = {}) {
    const sourceText = String(targeting?.target ?? "").trim() || null;
    const target = normalizedTarget(sourceText);
    if (!target) {
        const description = String(descriptionHTML)
            .split(/<hr\b/i, 1)[0]
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        if (/\bliving creatures?\b[^.]{0,160}\b(?:must )?attempts?\b[^.]{0,80}\bsave\b/.test(description)) {
            return {
                sourceText: "description: living creatures attempting the save",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "living-creature" }]
            };
        }
        if (/\bundead creatures?\b[^.]{0,160}\b(?:must )?attempts?\b[^.]{0,80}\bsave\b/.test(description)) {
            return {
                sourceText: "description: undead creatures attempting the save",
                supportsActorTargets: true,
                complete: true,
                predicates: [{ kind: "trait", slug: "undead", present: true }]
            };
        }
        return {
            sourceText,
            supportsActorTargets: requiresActorTargets,
            complete: true,
            predicates: []
        };
    }

    if (/\b(?:items?|objects?)\b/.test(target) && !/\bcreatures?\b/.test(target)) {
        return { sourceText, supportsActorTargets: false, complete: true, predicates: [] };
    }
    if (/^(?:one|\d+|up to (?:one|\d+)|(?:one|\d+) or (?:one|\d+)) creatures?(?: or objects?)?$/.test(target)) {
        return { sourceText, supportsActorTargets: true, complete: true, predicates: [] };
    }
    const trait = /^(?:one|\d+) (undead) creatures?$/.exec(target)?.[1] ?? null;
    if (trait) {
        return {
            sourceText,
            supportsActorTargets: true,
            complete: true,
            predicates: [{ kind: "trait", slug: trait, present: true }]
        };
    }
    if (/^(?:one|\d+) living creatures?$/.test(target)) {
        return {
            sourceText,
            supportsActorTargets: true,
            complete: true,
            predicates: [{ kind: "living-creature" }]
        };
    }
    return {
        sourceText,
        supportsActorTargets: /\bcreatures?\b/.test(target),
        complete: false,
        predicates: []
    };
}
