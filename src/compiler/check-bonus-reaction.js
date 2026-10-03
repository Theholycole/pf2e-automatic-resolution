// A reaction that adds a bonus to a check already rolled (Practice Makes Perfect):
//   "Trigger You or an ally within range fails a skill check for a skill in which you or they are trained." / "The target gains a +2 status
//   bonus to the triggering check, or a +3 bonus if the target has master or better proficiency in the skill. This bonus can change the outcome
//   of the target's skill check."
// The check is already rolled, so no Effect can add to it: the module reads the triggering creature's latest skill check (its total, DC, die
// and modifiers), adds the bonus (a status bonus replaces a smaller one; it doesn't stack), and re-grades it; the card gives the new result.
// PF2e's own Effect (which would add to later checks) isn't applied.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^Trigger You or an ally within range fails a skill check for a skill in which you or they are trained\.$/;
const BONUS = /^The target gains a \+(\d) (status|circumstance) bonus to the triggering check, or a \+(\d) bonus if the target has master or better proficiency in the skill\.$/;
const CHANGE = /^This bonus can change the outcome of the target's skill check\.$/;

/** Returns {checkBonus, claimed} or null. */
export function compileCheckBonusReaction(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || !/^reaction$/i.test(String(adapted.activation?.time ?? adapted.time ?? "").trim())) return null;
    if (!/^the triggering creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (nativeSpellEffects?.references ?? []).length > 1) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/gi, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3 || !TRIGGER.test(sentences[0]) || !CHANGE.test(sentences[2])) return null;
    const bonus = BONUS.exec(sentences[1]);
    if (!bonus) return null;
    return {
        checkBonus: { type: bonus[2], value: Number(bonus[1]), masterValue: Number(bonus[3]), trainedRequired: true, failedOnly: true,
            ...((nativeSpellEffects?.references ?? []).length ? { ignoredEffect: nativeSpellEffects.references[0].label ?? nativeSpellEffects.references[0].reference } : {}), sourceText: sentences[1] },
        claimed: sentences
    };
}

const DEGREES = ["criticalFailure", "failure", "success", "criticalSuccess"];

/** PF2e's degree of success for a total against a DC, with the natural 20/1 step. */
export function checkDegree(total, dc, natural) {
    let index = total >= dc + 10 ? 3 : total >= dc ? 2 : total <= dc - 10 ? 0 : 1;
    if (natural === 20) index = Math.min(3, index + 1);
    else if (natural === 1) index = Math.max(0, index - 1);
    return DEGREES[index];
}

/** The re-graded check: the new total (the bonus replaces a smaller one of its type) and degree. */
export function regradeCheck({ total, dc, natural, existingOfType }, bonus) {
    const added = Math.max(0, bonus - Math.max(0, existingOfType));
    const newTotal = total + added;
    return { added, total: newTotal, degree: checkDegree(newTotal, dc, natural) };
}
