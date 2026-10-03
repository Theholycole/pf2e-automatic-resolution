// The caster and the target stuck together until it Escapes, with what that means set by their sizes (Stick On):
//   "You and the target become inseparable for the spell's duration or until the target Escapes." / "If the creature is smaller than you,
//   it's Immobilized and pulled along with you as you move." / "If the target is the same size as you, you're both pulled along with each
//   other as either moves, but you both treat all spaces as difficult terrain." / "If the target is larger than you, you're immobilized and
//   pulled along as the target moves." / "You can Dismiss this spell."
// Casting compares PF2e's sizes: the smaller creature's side gets PF2e's Immobilized (the target's, or the caster's); a bond Effect on the
// target ends with its Escape against the spell DC, which ends every Effect of the cast; the same size is a difficult-terrain note on both.
// Being pulled along is the GM's (moving the tokens). An object target is the GM's.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const BOND = /^You and the target become inseparable for the spell's duration or until the target (?:\[\[\/act escape\]\]\{Escapes\}|@UUID\[[^\]]+\]\{Escapes?\}|Escapes)\.$/;
const SMALLER = /^If the (?:creature|target) is smaller than you, it's (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) and pulled along with you as you move\.$/;
const SAME = /^If the (?:creature|target) is the same size as you, you're both pulled along with each other as either moves, but you both treat all spaces as difficult terrain\.$/;
const LARGER = /^If the (?:creature|target) is larger than you, you're (?:immobilized|@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) and pulled along as the target moves\.$/;
const DISMISS = /^You can Dismiss this spell\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|Escape\w*|immobilized|difficult)\b/i;

/** Returns {sizeBond, claimed} or null. */
export function compileSizeBond(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length || (nativeSpellEffects?.references ?? []).length) return null;
    if (!/^(?:1|one) creature(?: or object)?$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(html)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = pattern => sentences.findIndex(sentence => pattern.test(sentence));
    const bond = at(BOND), smaller = at(SMALLER), same = at(SAME), larger = at(LARGER), dismiss = at(DISMISS);
    if ([bond, smaller, same, larger].some(index => index < 0) || !(bond < smaller && smaller < same && same < larger)) return null;
    const claimed = new Set([bond, smaller, same, larger, ...(dismiss >= 0 ? [dismiss] : [])]);
    const rest = sentences.filter((_, index) => !claimed.has(index));
    if (rest.length > 1 || rest.some(sentence => NARRATION_RULES.test(sentence)) || (rest.length && sentences.indexOf(rest[0]) !== 0)) return null;
    const immobilized = /@UUID\[([^\]]+)\]/.exec(SMALLER.exec(sentences[smaller])[1])[1];
    return {
        sizeBond: {
            condition: { uuid: immobilized, name: "Immobilized", slug: "immobilized" },
            escape: { dc: "spell" }, dismissible: dismiss >= 0, durationSeconds: Number(minutes[1]) * 60,
            objects: /\bor object$/i.test(String(adapted.targeting.target).trim()),
            texts: { bond: sentences[bond], smaller: sentences[smaller].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"), same: sentences[same],
                larger: sentences[larger].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") }
        },
        claimed: [...claimed].map(index => sentences[index])
    };
}

export const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

/** "smaller", "same" or "larger": the target's size against the caster's (PF2e size slugs). */
export function compareSizes(casterSize, targetSize) {
    const caster = SIZE_ORDER.indexOf(casterSize), target = SIZE_ORDER.indexOf(targetSize);
    if (caster < 0 || target < 0) return null;
    return target < caster ? "smaller" : target > caster ? "larger" : "same";
}

export function isExecutableSizeBond(bond) {
    return Boolean(bond) && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(bond.condition?.uuid ?? "") && bond.condition.slug === "immobilized"
        && bond.escape?.dc === "spell" && Number.isInteger(bond.durationSeconds) && bond.durationSeconds > 0
        && ["bond", "smaller", "same", "larger"].every(key => typeof bond.texts?.[key] === "string" && bond.texts[key].length > 0);
}
