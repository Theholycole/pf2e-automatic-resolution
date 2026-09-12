function escapeRegExp(value) {
    return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dependencyPatterns(effectName, dependencyName) {
    const effect = escapeRegExp(effectName);
    const dependency = escapeRegExp(dependencyName);
    const subject = "(?:it(?:'s| is| remains)?|the target(?: is| remains)?|the creature(?: is| remains)?|they(?:'re| are| remain)?)?";
    const effectLead = "(?:it(?:'s| is)\\s+(?:also\\s+)?|the target(?: is| becomes)?\\s+(?:also\\s+)?|the creature(?: is| becomes)?\\s+(?:also\\s+)?|they(?:'re| are| become)\\s+(?:also\\s+)?)?";

    return [
        new RegExp(`\\b${effect}\\b[^.;]{0,120}\\b(?:for\\s+)?as long as\\s+${subject}\\s*${dependency}\\b`, "i"),
        new RegExp(`\\b${effect}\\b[^.;]{0,120}\\bwhile\\s+${subject}\\s*${dependency}\\b`, "i"),
        new RegExp(`\\bwhile\\s+${subject}\\s*${dependency}\\b[^.;]{0,120}\\b${effectLead}${effect}\\b`, "i"),
        new RegExp(`\\b(?:for\\s+)?as long as\\s+${subject}\\s*${dependency}\\b[^.;]{0,120}\\b${effectLead}${effect}\\b`, "i"),
        new RegExp(`\\b${effect}\\b[^.;]{0,120}\\buntil\\s+${subject}\\s*(?:is\\s+)?no\\s+longer\\s+${dependency}\\b`, "i"),
        new RegExp(`\\b${effect}\\b[^.;]{0,120}\\buntil\\s+${dependency}\\b[^.;]{0,40}\\bends?\\b`, "i")
    ];
}

export function compileLinkedConditions(effects, text) {
    const source = String(text ?? "")
        .replace(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([^\]]+)\](?:\{([^}]+)\})?/gi,
            (_match, reference, label) => label ?? reference)
        .replace(/[’]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    const compiled = [];

    for (const effect of effects ?? []) {
        const dependency = (effects ?? []).find(candidate =>
            candidate !== effect
            && candidate.slug !== effect.slug
            && dependencyPatterns(effect.name, candidate.name).some(pattern => pattern.test(source))
        );

        compiled.push(dependency ? {
            ...effect,
            duration: null,
            whileCondition: dependency.slug,
            whileConditionName: dependency.name,
            endsWhen: { event: "condition-removed", condition: dependency.slug }
        } : effect);
    }

    return compiled;
}
