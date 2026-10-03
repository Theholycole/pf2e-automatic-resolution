// A self spell that makes the caster invisible for a Stride and a Hide check, after which the invisibility ends (Flashy Disappearance):
//   "… while you become temporarily Invisible." / "You become Undetected to all creatures unless they can see invisible creatures." / "You
//   Stride." / "At the end of your movement, if you have cover, greater cover, or concealment, attempt a @Check[stealth|traits:action:hide] check
//   to Hide." / "You gain a +2 status bonus to this Stealth check." / "The invisibility then ends, and you either become Observed or Hidden to
//   creatures as determined by your check to Hide, if you made one." with PF2e's Effect (Invisible's GrantItem and the +2 Hide bonus).
// Casting applies PF2e's Effect to the caster and posts the card: the caster Strides, then uses the card. "Hide" rolls PF2e's Stealth check with
// the Hide option (the Effect's bonus applies), compares it with each creature's Perception DC (Hidden to those it meets, Observed to the rest),
// and ends the invisibility; "No cover" just ends it. PF2e's Hidden condition goes on the caster when the check meets every creature's DC.
import { htmlToPlainText } from "./description-parser.js";

const COND = name => `@UUID\\[Compendium\\.pf2e\\.conditionitems\\.Item\\.[A-Za-z0-9]+\\]\\{${name}\\}`;
const INVISIBLE = new RegExp(`^[^@\\d]*\\bwhile you become temporarily ${COND("Invisible")}\\.$`);
const UNDETECTED = new RegExp(`^You become ${COND("Undetected")} to all creatures unless they can see invisible creatures\\.$`);
const STRIDE = /^You Stride\.$/;
const HIDE = /^At the end of your movement, if you have cover, greater cover, or concealment, attempt a @Check\[stealth\|traits:action:hide\] check to Hide\.$/;
const BONUS = /^You gain a \+(\d) (status|circumstance) bonus to this Stealth check\.$/;
const ENDS = new RegExp(`^The invisibility then ends, and you either become ${COND("Observed")} or ${COND("Hidden")} to creatures as determined by your check to Hide, if you made one\\.$`);

/** Returns {strideHide, claimed} or null. */
export function compileStrideHide(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b|<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const sentences = htmlToPlainText(html.replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/gi, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const patterns = [INVISIBLE, UNDETECTED, STRIDE, HIDE, BONUS, ENDS];
    if (sentences.length !== patterns.length || sentences.some((sentence, index) => !patterns[index].test(sentence))) return null;
    const [, value, type] = BONUS.exec(sentences[4]);
    // The Effect must be exactly Invisible's grant and the stated bonus on Hide.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const invisibleUuid = /@UUID\[([^\]]+)\]\{Invisible\}/.exec(sentences[0])[1];
    const grant = rules.find(rule => rule.key === "GrantItem"), bonus = rules.find(rule => rule.key === "FlatModifier");
    if (rules.length !== 2 || grant?.uuid !== invisibleUuid || !(bonus?.selector === "stealth" && bonus.type === type && Number(bonus.value) === Number(value) && JSON.stringify(bonus.predicate) === '["action:hide"]')) return null;
    return {
        strideHide: { effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, bonus: { type, value: Number(value) },
            hiddenUuid: /@UUID\[([^\]]+)\]\{Hidden\}/.exec(sentences[5])[1], requirement: "cover, greater cover, or concealment", sourceText: sentences[3] },
        claimed: sentences
    };
}

/** Each observer's result against the Hide total: Hidden when it meets the Perception DC. */
export function hideResults(total, observers) {
    return observers.map(observer => ({ ...observer, hidden: Number(total) >= Number(observer.dc) }));
}

export function isExecutableStrideHide(data) {
    return Boolean(data) && typeof data.effect?.uuid === "string" && Number.isInteger(data.bonus?.value) && /^Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+$/.test(data.hiddenUuid ?? "");
}
