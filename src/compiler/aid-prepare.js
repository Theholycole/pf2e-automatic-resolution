// A spell that counts as preparing to Aid an ally, with a better Aid check (Uplifting Overture; user decision):
//   "This counts as having prepared to Aid your ally on a skill check of your choice." / "When you later use the Aid reaction, you can roll
//   Performance instead of the normal skill check, and if you roll a failure, you get a success instead." / "If you are legendary in
//   Performance, you automatically critically succeed." / "The GM might rule that you can't use this ability if …".
// Casting asks the skill the ally will attempt, rolls the caster's Aid check with the stated skill against the Aid DC (a failure becomes a
// success; legendary is a critical success), and puts the Aid result on the ally as a circumstance modifier to that skill's next check
// (critical success +2, +3 master, +4 legendary; success +1; critical failure −1). PF2e's own Effect (built around the caster) isn't applied.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_TIMED as NARRATION_RULES } from "./text-patterns.js";

const PREPARED = /^This counts as having prepared to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Aid\}|Aid) your ally on a skill check of your choice\.$/;
const LATER = /^When you later use the Aid reaction, you can roll ([A-Z][a-z]+) instead of the normal skill check, and if you roll a failure, you get a success instead\.$/;
const LEGENDARY = /^If you are legendary in ([A-Z][a-z]+), you automatically critically succeed\.$/;
const GM_RULE = /^The GM might rule that you can't use this ability if the act of encouraging your ally would interfere with the skill check \(such as [^)]{5,120}\)\.$/;

/** Returns {aidPrepare, claimed} or null. */
export function compileAidPrepare(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length) return null;
    if (!/^(?:1|one) ally$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area || (nativeSpellEffects?.references ?? []).length > 1) return null;
    if (!/^1 round$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/gi, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => PREPARED.test(sentence));
    if (at < 0 || at > 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const later = LATER.exec(sentences[at + 1] ?? ""), legendary = LEGENDARY.exec(sentences[at + 2] ?? ""), gm = GM_RULE.test(sentences[at + 3] ?? "");
    if (!later || !legendary || legendary[1] !== later[1] || !gm || sentences.length !== at + 4) return null;
    const references = nativeSpellEffects?.references ?? [];
    return {
        aidPrepare: { skill: later[1].toLowerCase(), failureToSuccess: true, legendaryCritical: true, dc: 15, gmNote: sentences[at + 3].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"),
            ...(references.length ? { ignoredEffect: references[0].label ?? references[0].reference } : {}), sourceText: sentences[at] },
        claimed: sentences
    };
}

/** The Aid check's result after the spell's adjustments. */
export function aidPrepareDegree(aid, rolled, rank) {
    if (aid.legendaryCritical && rank >= 4) return "criticalSuccess";
    if (aid.failureToSuccess && rolled === "failure") return "success";
    return rolled;
}

/** The Aid modifier for a result and the Aid skill's rank (PF2e's Aid: critical success +2, +3 master, +4 legendary; success +1; critical failure −1). */
export function aidModifier(degree, rank) {
    if (degree === "criticalSuccess") return rank >= 4 ? 4 : rank >= 3 ? 3 : 2;
    if (degree === "success") return 1;
    if (degree === "criticalFailure") return -1;
    return 0;
}

export const AID_SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism",
    "performance", "religion", "society", "stealth", "survival", "thievery"];
