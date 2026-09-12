import { classifyManualSemantics } from "./outcome-semantics.js";

const MECHANIC_SIGNALS = Object.freeze([
    ["save", /\b(?:save|saving throw)\b|@Check\[/i],
    ["damage", /\b(?:damage|hit points?|HP)\b|@Damage\[/i],
    ["condition", /\b(?:condition|@UUID\[Compendium\.pf2e\.conditionitems\.)/i],
    ["duration", /\b(?:rounds?|minutes?|hours?|days?|weeks?|until|duration|sustain)\b/i],
    ["action", /\b(?:actions?|reactions?|Strike|Stride|Step|Fly|Leap|Interact|Escape)\b/i],
    ["movement", /\b(?:move|moved|pulled|pushed|teleport|feet|squares?)\b/i],
    ["modifier", /\b(?:bonus|penalty|modifier|DC|weakness|resistance|immunity|immune)\b/i],
    ["choice", /\b(?:choose|choice|random|roll \[\[)\b/i],
    ["state", /\b(?:dies?|killed|decapitated|transformed?|petrified|afflicted|stage \d+)\b/i],
    ["timing", /\b(?:start|beginning|end|whenever|each time|first time|temporarily)\b/i]
]);

function clauses(text) {
    return String(text ?? "")
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?;])\s+|\n+/)
        .map(value => value.trim())
        .filter(Boolean);
}

function effectMentioned(effect, text) {
    return text.includes(effect.raw)
        || new RegExp(`\\b${String(effect.name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function nativeEffectMentioned(effect, text) {
    return text.includes(effect.sourceText)
        || text.includes(effect.uuid)
        || text.includes(effect.reference);
}

function unique(values) {
    return [...new Set(values)];
}

export function analyzeResidualProse(outcome) {
    const results = [];
    for (const text of clauses(outcome?.rawText)) {
        const compiled = [];
        let guided = classifyManualSemantics(text).map(instruction => instruction.kind);
        const signals = MECHANIC_SIGNALS.filter(([, pattern]) => pattern.test(text)).map(([kind]) => kind);
        const effects = (outcome?.effects ?? []).filter(effect => effectMentioned(effect, text));
        const nativeEffects = (outcome?.nativeEffects ?? []).filter(effect => nativeEffectMentioned(effect, text));
        const saveFollowUps = (outcome?.followUps ?? []).filter(followUp => followUp.kind === "save");
        const secondarySaves = /\b(?:save|saving throw)\b/i.test(text) || /@Check\[/i.test(text)
            ? saveFollowUps
            : [];
        const secondaryBranches = (outcome?.followUps ?? [])
            .filter(followUp => followUp.kind === "save")
            .flatMap(followUp => Object.values(followUp.outcomes ?? {}).filter(Boolean));
        const secondaryOutcome = secondaryBranches.find(branch =>
            branch.rawText && (branch.rawText.includes(text) || text.includes(branch.rawText))
        );
        const secondarySourceClaimed = saveFollowUps.some(followUp =>
            followUp.complete && followUp.rawText.includes(text)
        );

        if (/\b(?:unaffected|no effect|nothing happens)\b/i.test(text)) compiled.push("no-effect");
        if (/\bso afraid\b[^.!?]*\bmight (?:instantly )?die\b/i.test(text)) compiled.push("narrative-context");
        if (/^As (?:a )?(?:critical success|success|critical failure|failure)\b/i.test(text)) compiled.push("outcome-inheritance");
        if (outcome?.damage?.mode !== "none" && (/\bdamage\b/i.test(text) || /@Damage\[/i.test(text))) compiled.push("damage");
        if (effects.length) compiled.push(...effects.map(effect => effect.whileCondition ? "linked-condition" : "condition"));
        if (nativeEffects.length) compiled.push("native-spell-effect");
        if (effects.some(effect => effect.endsWhen)) compiled.push("condition-expiration");
        if (outcome?.terminal && /\b(?:dies?|killed)\b/i.test(text)) compiled.push("terminal");
        if (secondarySaves.length) compiled.push("secondary-save");
        if (secondaryOutcome || secondarySourceClaimed) compiled.push("secondary-outcome");
        if (!secondaryOutcome && secondaryBranches.some(branch => branch.terminal)
            && /\b(?:fails?|critical failure)\b[^.!?;]*\b(?:dies?|killed)\b/i.test(text)) {
            compiled.push("secondary-outcome");
        }
        if (compiled.includes("secondary-save")) guided = guided.filter(kind => kind !== "secondary-save");
        if (compiled.includes("secondary-outcome")
            && !secondaryOutcome?.manualInstructions?.length) {
            guided = guided.filter(kind => kind !== "conditional-effect");
        }

        const unexplainedSignals = signals.filter(signal => {
            if (signal === "save") return !compiled.includes("secondary-save");
            if (signal === "damage") return !compiled.includes("damage") && !compiled.includes("terminal")
                && !compiled.includes("secondary-outcome");
            if (signal === "condition") return !compiled.includes("condition") && !compiled.includes("linked-condition")
                && !compiled.includes("secondary-outcome");
            if (signal === "duration") return !effects.some(effect => effect.duration || effect.whileCondition || effect.endsWhen)
                && !compiled.includes("secondary-outcome");
            if (signal === "state") return !compiled.includes("terminal") && !compiled.includes("secondary-outcome")
                && !/\bmight (?:instantly )?die\b/i.test(text) && guided.length === 0;
            if (signal === "timing" && compiled.includes("secondary-outcome")) return false;
            if (signal === "timing" && compiled.includes("condition-expiration")) return false;
            if (signal === "action" && effects.some(effect =>
                (Array.isArray(effect.endsWhen) ? effect.endsWhen : [effect.endsWhen]).filter(Boolean)
                    .some(event => ["escape", "used", "expended", "discharged"].includes(event.event)))) return false;
            if (signal === "movement" && effects.some(effect =>
                (Array.isArray(effect.endsWhen) ? effect.endsWhen : [effect.endsWhen]).filter(Boolean)
                    .some(event => event.event === "leave-area"))) return false;
            return guided.length === 0;
        });
        const accounted = compiled.length > 0 || guided.length > 0;

        results.push({
            text,
            status: unexplainedSignals.length > 0 || !accounted ? "residual" : guided.length > 0 ? "guided" : "compiled",
            compiledClaims: unique(compiled),
            guidedClaims: unique(guided),
            unexplainedSignals: unique(unexplainedSignals)
        });
    }

    const residualClauses = results.filter(result => result.status === "residual");
    const guidedClauses = results.filter(result => result.status === "guided");
    return {
        complete: residualClauses.length === 0,
        fullyCompiled: residualClauses.length === 0 && guidedClauses.length === 0,
        clauseCount: results.length,
        compiledClauseCount: results.filter(result => result.status === "compiled").length,
        guidedClauseCount: guidedClauses.length,
        residualClauseCount: residualClauses.length,
        clauses: results
    };
}
