// Counteracting a poison and moving it to the caster's weapon (Extract Poison; user decision 2026-10-01: the counteract is rolled on the card):
//   "Attempt a counteract check against one poison you're aware of on or in an object you touch." / "If you successfully counteract the poison,
//   you negate the object's toxicity and transfer the poison into a weapon you are holding, coating the weapon with a simple but powerful
//   poison." / "On your next successful attack with that weapon before the end of your next turn, you add 1d6 poison damage per level of the
//   poison you counteracted." / "On a critically failed attack roll, you lose the extracted poison from your weapon as normal." with PF2e's
//   Spell Effect: Extract Poison (a held weapon, the poison's level, and that many d6 poison on the weapon's damage).
// The card's Counteract: the GM names the poison and its level and counteract DC; the caster's PF2e counteract check decides. On a success,
// PF2e's Effect goes on the caster, preset to the held weapon and the level, until the end of its next turn; the module removes it after the
// next damage roll with that weapon, or a critically failed attack roll with it.
import { htmlToPlainText } from "./description-parser.js";

const SENTENCES = [
    /^Attempt a counteract check against one ([a-z]+) you're aware of on or in an object you touch\.$/,
    /^If you successfully counteract the ([a-z]+), you negate the object's toxicity and transfer the \1 into a weapon you are holding, coating the weapon with a simple but powerful \1\.$/,
    /^On your next successful attack with that weapon before the end of your next turn, you add 1d(\d+) ([a-z]+) damage per level of the ([a-z]+) you counteracted\.$/,
    /^On a critically failed attack roll, you lose the extracted ([a-z]+) from your weapon as normal\.$/
];
// ("save it for your own later use" is narration; a saving throw isn't.)
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saving throws?|(?:Fortitude|Reflex|Will) saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|counteract)\b/i;

/** PF2e's Effect: a held-weapon choice, a level choice, and DamageDice of that many dX of the type on the chosen weapon. */
export function transferEffectShape(rules, faces, type) {
    if (!Array.isArray(rules) || rules.length !== 3) return null;
    const weapon = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.ownedItems === true && JSON.stringify(rule.choices.types) === '["weapon"]');
    const level = rules.find(rule => rule.key === "ChoiceSet" && rule.choices?.config === "levels");
    const dice = rules.find(rule => rule.key === "DamageDice");
    if (!weapon?.flag || !level?.flag || !dice) return null;
    if (dice.damageType !== type || dice.dieSize !== `d${faces}` || dice.diceNumber !== `@item.flags.system.rulesSelections.${level.flag}`
        || dice.selector !== `{item|flags.system.rulesSelections.${weapon.flag}}-damage`) return null;
    return { weaponFlag: weapon.flag, levelFlag: level.flag };
}

/** Returns {counteractTransfer, claimed} or null. */
export function compileCounteractTransfer(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    if (!/^(?:1|one) poison on or in an object$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved" || !links[0].document?.id) return null;
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1])) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => SENTENCES[0].test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + SENTENCES.length || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
    const matches = SENTENCES.map((pattern, index) => pattern.exec(sentences[at + index]));
    if (matches.some(match => !match)) return null;
    const thing = matches[0][1];
    if (matches[1][1] !== thing || matches[2][3] !== thing || matches[3][1] !== thing) return null;
    const faces = Number(matches[2][1]), type = matches[2][2];
    const shape = transferEffectShape(links[0].document.mechanics?.rules, faces, type);
    if (!shape) return null;
    return {
        counteractTransfer: { thing, faces, type, effect: { uuid: links[0].uuid, id: links[0].document.id, label: links[0].label ?? links[0].reference ?? null }, ...shape },
        claimed: sentences.slice(at)
    };
}
