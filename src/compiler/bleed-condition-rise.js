// A save's opening rules around its degree table (Expunge Blood): "A nonliving creature with blood in its body (such as a vampire) can be affected, but a
// creature with no blood is immune." (the GM's yes/no on the target) and "The clumsy condition inflicted by this spell increases by 1 while the target is
// taking persistent bleed damage." — on each row that gives that condition, a note Effect for as long as it lasts whose rule raises the condition's value
// while the creature has PF2e's persistent damage of that type (PF2e keeps one condition of a slug, so the rule meets the spell's). A condition with its own
// recovery listed with a timed one ("Drained 1 and Clumsy 1 for 1 round") keeps its own recovery (the user's ruling on such lists, 2026-10-02).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const MUST_SAVE = /^The target must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
const BLOOD = /^A nonliving creature with (blood) in its body \(such as a [a-z]+\) can be affected, but a creature with no \1 is immune\.$/;
const RISES = /^The ([a-z]+) condition inflicted by this spell increases by (\d) while the target is taking persistent ([a-z]+) damage\.$/;
const OWN_RECOVERY = new Set(["drained", "doomed", "wounded"]);

/** {gmQuestion, rise: {slug, value, type}, sentences} or null. */
export function readBleedConditionRise(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length) return null;
    const [opening] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(opening).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0])) return null;
    const save = MUST_SAVE.exec(sentences[1]), blood = BLOOD.exec(sentences[2]), rise = RISES.exec(sentences[3]);
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic || !blood || !rise) return null;
    return { gmQuestion: { question: "Does the target have blood in its body (a creature with none is immune)?", sourceText: sentences[2] },
        rise: { slug: rise[1], value: Number(rise[2]), type: rise[3], sourceText: sentences[3] }, sentences };
}

/** Applies the read to the compiled plan's rows; false if a row doesn't fit. */
export function applyBleedConditionRise(plan, read) {
    let rows = 0;
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const outcome = plan.resolution.outcomes?.[degree];
        const governed = (outcome?.effects ?? []).find(effect => effect.kind === "condition" && effect.slug === read.rise.slug);
        if (!governed) continue;
        if (governed.duration?.mode !== "fixed") return false;
        outcome.noteEffects = [...(outcome.noteEffects ?? []), { label: `${read.rise.slug[0].toUpperCase()}${read.rise.slug.slice(1)} rises with ${read.rise.type}`, text: read.rise.sourceText,
            sourceText: read.rise.sourceText, claimsRow: false, rules: [{ key: "ItemAlteration", itemType: "condition", mode: "add", property: "badge-value", value: read.rise.value,
                predicate: [`item:slug:${read.rise.slug}`, `self:condition:persistent-damage:${read.rise.type}`] }], duration: { ...governed.duration } }];
        // (Its own-recovery companions in the list keep their own recovery.)
        for (const effect of outcome.effects) if (OWN_RECOVERY.has(effect.slug) && effect.duration?.mode === "fixed" && effect.duration.sourceText === governed.duration.sourceText) {
            effect.duration = null; delete effect.expirationMode; delete effect.lifetimeProof;
        }
        rows++;
    }
    return rows > 0;
}
