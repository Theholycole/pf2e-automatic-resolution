// A spell attack made by hurling the caster's weapon, whose damage is the weapon's own Strike damage (Hand of the Apprentice):
//   "You hurl a held melee weapon with which you are trained at the target, making a spell attack roll." / "On a success, you deal the
//   weapon's damage as if you had hit with a melee Strike, but adding your spellcasting ability modifier to damage, rather than your Strength
//   modifier." / "On a critical success, you deal double damage, and you add the weapon's critical specialization effect." / "Regardless of
//   the outcome, the weapon flies back to you and returns to your hand." with PF2e's Effect (the weapon's choice, the ability modifier
//   forced on its damage, and its critical specialization).
// Guided (user decision): the card puts PF2e's Effect on the caster for the chosen weapon, rolls PF2e's spell attack, and on a hit offers
// the weapon's own Strike damage roll (critical on a critical success); PF2e's damage card applies it.
import { htmlToPlainText } from "./description-parser.js";

const HURL = /^You hurl a held melee weapon with which you are trained at the target, making a spell attack roll\.$/;
const HIT = /^On a success, you deal the weapon's damage as if you had hit with a melee Strike, but adding your spellcasting ability modifier to damage, rather than your Strength modifier\.$/;
const CRIT = /^On a critical success, you deal double damage, and you add the weapon's critical specialization effect\.$/;
const RETURNS = /^Regardless of the outcome, the weapon flies back to you and returns to your hand\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|attack)\b/i;

/** PF2e's Effect: a weapon ChoiceSet, one ability FlatModifier forced on that weapon's damage, and that weapon's critical specialization. */
export function proveWeaponThrowEffect(mechanics) {
    const rules = mechanics?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet"), modifier = rules.find(rule => rule.key === "FlatModifier"), special = rules.find(rule => rule.key === "CriticalSpecialization");
    if (rules.length !== 3 || !choice || !modifier || !special || typeof choice.flag !== "string") return null;
    if (choice.choices?.ownedItems !== true || JSON.stringify(choice.choices?.types) !== '["weapon"]') return null;
    const selected = `{item|flags.system.rulesSelections.${choice.flag}}`;
    if (modifier.type !== "ability" || modifier.force !== true || !/^(?:str|dex|con|int|wis|cha)$/.test(modifier.ability ?? "") || modifier.selector !== `${selected}-damage` || modifier.predicate != null) return null;
    if (JSON.stringify(special.predicate) !== JSON.stringify([`item:id:${selected}`])) return null;
    return { flag: choice.flag, ability: modifier.ability };
}

/** Returns {weaponThrow, claimed} or null. */
export function compileWeaponThrow(adapted, nativeSpellEffects) {
    if (!adapted.activation?.traits?.includes("attack") || adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || (nativeSpellEffects.references ?? []).length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const proof = proveWeaponThrowEffect(links[0].document?.mechanics);
    if (!proof) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<strong\b[^>]*>\s*Heightened\b/i.test(html)) return null;
    const sentences = htmlToPlainText(html.replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/gi, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const hurlAt = sentences.findIndex(sentence => HURL.test(sentence));
    if (hurlAt < 0 || sentences.length !== hurlAt + 4 || !HIT.test(sentences[hurlAt + 1]) || !CRIT.test(sentences[hurlAt + 2]) || !RETURNS.test(sentences[hurlAt + 3])) return null;
    if (sentences.slice(0, hurlAt).some(sentence => NARRATION_RULES.test(sentence)) || hurlAt > 1) return null;
    return {
        // "adding your spellcasting ability modifier to damage": PF2e's modifier names one attribute; the runtime sets it to the caster's
        // spellcasting attribute (user decision: the text).
        weaponThrow: { effect: { uuid: links[0].uuid, label: links[0].label }, flag: proof.flag, ability: proof.ability, abilityFromSpellcasting: true, sourceText: sentences[hurlAt] },
        claimed: sentences
    };
}
