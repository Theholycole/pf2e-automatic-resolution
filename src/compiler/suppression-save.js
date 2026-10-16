// An ally's save to suppress an effect, and its bonuses (Rude Awakening, PF2e 8.6):
//   "You conjure frigid water and douse an ally, fortifying their resolve." / "The target can immediately attempt a Will save with a +2 circumstance bonus
//   against an ongoing emotion effect or against the frightened or stupefied condition, suppressing the effect or condition for the duration on a success." /
//   "In addition, the target gains a +1 status bonus to all saving throws for the duration, which increases to a +2 status bonus to saving throws against
//   emotion effects." with PF2e's own Effect link.
// The user's decision (2026-10-16, option A): a card for the ally — the GM picks the effect or condition and types its DC; the module rolls the Will save with
// the bonus; on a success it removes the condition (or the effect) and puts it back when the spell's minute ends, if it would still apply. The bonuses are the
// module's Effect, status as written (PF2e's Effect gives them as circumstance bonuses).
import { htmlToPlainText } from "./description-parser.js";

const SAVE = /^The target can immediately attempt an? (Fortitude|Reflex|Will) save with a \+(\d) (circumstance|status) bonus against an ongoing ([a-z]+) effect or against the ([a-z]+) or ([a-z]+) condition, suppressing the effect or condition for the duration on a success\.$/;
const BONUS = /^In addition, the target gains a \+(\d) status bonus to all saving throws for the duration, which increases to a \+(\d) status bonus to saving throws against ([a-z]+) effects\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|must|each)\b/i;
const SELF_LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g;

/** Returns {suppressionSave, claimed} or null. */
export function compileSuppressionSave(adapted) {
    if ((adapted.defense?.kind !== "none" && adapted.defense?.kind !== undefined) || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || adapted.lifecycle?.sustained || !/^1 allied creature$|^1 ally$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b|Heightened/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(SELF_LINK, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => SAVE.test(sentence));
    if (at < 0 || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const save = SAVE.exec(sentences[at]), bonus = BONUS.exec(sentences[at + 1]);
    if (!bonus || bonus[3] !== save[4]) return null;
    const trait = save[4];
    return {
        suppressionSave: {
            statistic: save[1].toLowerCase(), bonus: { value: Number(save[2]), type: save[3] },
            against: { traits: [trait], conditions: [save[5], save[6]] }, seconds: Number(minutes[1]) * 60,
            // (Both status bonuses: the higher, +2, against an emotion effect — PF2e takes the highest of a type.)
            rules: [{ key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(bonus[1]), slug: "suppression-save-all" },
                { key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(bonus[2]), predicate: [`item:trait:${trait}`], slug: `suppression-save-${trait}` }],
            sourceText: [sentences[at], sentences[at + 1]]
        },
        claimed: sentences
    };
}
