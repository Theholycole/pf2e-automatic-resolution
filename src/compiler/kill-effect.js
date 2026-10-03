// "If this kills it, you gain 10 temporary HP and a +1 status bonus to attack and damage rolls for 10 minutes." with the Spell
// Effect linked after the table (Death Knell): the caster's Effect, given when a row's death is applied. The Effect's rules must be
// exactly the sentence's (checked again by the core against the stored mechanics).
// "The target's Dying value increases by 1.": the row raises the condition by that much (PF2e's own increase), not a new condition.
import { htmlToPlainText } from "./description-parser.js";

export const KILL_BENEFIT = /^If this kills it, you gain (\d+) temporary HP and a \+(\d+) status bonus to attack and damage rolls for (\d+) (minute|round)s?\.$/;
export const VALUE_INCREASE = /^The target's @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{([A-Z][a-z]+)\} value increases by (\d)\.$/;

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
