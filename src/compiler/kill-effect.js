// "If this kills it, you gain 10 temporary HP and a +1 status bonus to attack and damage rolls for 10 minutes." with the Spell
// Effect linked after the table (Death Knell): the caster's Effect, given when a row's death is applied. The Effect's rules must be
// exactly the sentence's (checked again by the core against the stored mechanics).
// "The target's Dying value increases by 1.": the row raises the condition by that much (PF2e's own increase), not a new condition.
import { htmlToPlainText } from "./description-parser.js";

export const KILL_BENEFIT = /^If this kills it, you gain (\d+) temporary HP and a \+(\d+) status bonus to attack and damage rolls for (\d+) (minute|round)s?\.$/;
export const VALUE_INCREASE = /^The target's @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\} value increases by (\d)\.$/;
// (Judge Soul, Witches+: "… is Drained 1 or increases its drained value by 1 if it was already drained." — the same increase, within a row with damage.)
export const OR_INCREASE = /^is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+) (\d)\} or increases its ([a-z]+) value by \2 if it was already \3$/;

/** The Effect's rules match the sentence: TempHP and a status FlatModifier to attack and damage, for that time. */
export function killEffectMatches(mechanics, benefit) {
    const rules = mechanics?.rules ?? [];
    const duration = mechanics?.duration ?? {};
    return rules.length === 2
        && rules.some(rule => rule.key === "TempHP" && Number(rule.value) === benefit.temporaryHP && Object.keys(rule).every(key => ["key", "value"].includes(key)))
        && rules.some(rule => rule.key === "FlatModifier" && rule.type === "status" && Number(rule.value) === benefit.bonus
            && JSON.stringify([...(rule.selector ?? [])].sort()) === '["attack","damage"]' && rule.predicate == null)
        && Number(duration.value) === benefit.duration.value && duration.unit === benefit.duration.unit;
}

export function compileKillEffect(plan, adapted) {
    const prefix = String(adapted.descriptionHTML ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentence = htmlToPlainText(prefix).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).find(value => KILL_BENEFIT.test(value));
    const outcomes = plan.resolution?.outcomes ?? {};
    // Each row's "value increases by N".
    for (const outcome of Object.values(outcomes)) {
        // ("… is Drained 1 or increases its drained value by 1 if it was already drained.": that clause.)
        const clause = /is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+ \d\} or increases its [a-z]+ value by \d if it was already [a-z]+/.exec(String(outcome?.rawText ?? ""));
        const orIncrease = clause ? OR_INCREASE.exec(clause[0]) : null;
        if (orIncrease && orIncrease[1].toLowerCase() === orIncrease[3]) {
            const slug = orIncrease[3];
            const effects = outcome.effects ?? [];
            if (effects.length === 1 && effects[0].slug === slug && effects[0].value === Number(orIncrease[2]) && effects[0].duration == null) {
                outcome.effects = [];
                outcome.conditionIncreases = [{ slug, amount: Number(orIncrease[2]), sourceText: clause[0] }];
                outcome.manualInstructions = (outcome.manualInstructions ?? []).filter(instruction => instruction.kind !== "conditional-effect");
                // (The clause is the increase's: its coverage, already analysed, updated.)
                for (const entry of outcome.semanticCoverage?.clauses ?? []) if (entry.text.includes(clause[0]) && entry.status !== "compiled" && !entry.unexplainedSignals?.length)
                    Object.assign(entry, { status: "compiled", compiledClaims: [...new Set([...(entry.compiledClaims ?? []), "condition-increase"])], guidedClaims: [] });
                if (outcome.semanticCoverage?.clauses) {
                    const clauses = outcome.semanticCoverage.clauses;
                    Object.assign(outcome.semanticCoverage, { compiledClauseCount: clauses.filter(entry => entry.status === "compiled").length, guidedClauseCount: clauses.filter(entry => entry.status === "guided").length,
                        residualClauseCount: clauses.filter(entry => entry.status === "residual").length });
                    outcome.semanticCoverage.complete = outcome.semanticCoverage.residualClauseCount === 0;
                    outcome.semanticCoverage.fullyCompiled = clauses.every(entry => entry.status === "compiled");
                }
                if (!Object.values(outcomes).some(other => (other?.manualInstructions ?? []).some(instruction => instruction.kind === "conditional-effect")))
                    plan.automation.pendingCapabilities = plan.automation.pendingCapabilities.filter(capability => capability !== "manual:conditional-effect");
            }
            continue;
        }
        const increase = VALUE_INCREASE.exec(htmlToPlainText(outcome?.rawText ?? "").trim());
        if (!increase) continue;
        const slug = increase[1].toLowerCase();
        const effects = outcome.effects ?? [];
        if (effects.length !== 1 || effects[0].slug !== slug || effects[0].value != null || effects[0].duration != null) continue;
        outcome.effects = [];
        outcome.conditionIncreases = [{ slug, amount: Number(increase[2]), sourceText: increase[0] }];
    }
    if (!sentence) return null;
    const [, hp, bonus, time, unit] = KILL_BENEFIT.exec(sentence);
    const benefit = { temporaryHP: Number(hp), bonus: Number(bonus), duration: { value: Number(time), unit: `${unit}s` } };
    // The linked Effect on the rows where the target dies, given to the caster.
    const rows = Object.values(outcomes).filter(outcome => (outcome?.nativeEffects ?? []).some(effect => effect.recipient?.evidence === "source-benefit-on-outcome"));
    if (!rows.length || rows.some(outcome => outcome.terminal?.kind !== "death" || outcome.nativeEffects.length !== 1)
        || Object.values(outcomes).some(outcome => outcome?.terminal?.kind === "death" && !rows.includes(outcome))) return null;
    const effect = rows[0].nativeEffects[0];
    if (effect.resolutionStatus !== "resolved" || !effect.document?.id || !killEffectMatches(effect.document.mechanics, benefit)) return null;
    for (const outcome of rows) outcome.nativeEffects = [];
    const { triggerAnalysis, scope, degrees, recipient, applicationRequiresConfirmation, ...rest } = effect;
    plan.resolution.killEffect = { ...rest, link: rest.sourceText, ...benefit, sourceText: sentence };
    return sentence;
}
