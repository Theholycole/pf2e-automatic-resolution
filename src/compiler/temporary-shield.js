// A body part that works as a shield for the spell's duration (Shielded Arm):
//   "It can use the Raise a Shield action to instead raise its arm, gaining a +2 circumstance bonus to AC." / "It can Shield Block with its
//   Raised arm as well; when it does, the target reduces the damage as if it had a shield with Hardness 4 and 15 Hit Points." / "This shield
//   doesn't have a Broken Threshold, and the spell ends if the shield's Hit Points are expended." with notes ("doesn't modify the target's
//   unarmed attacks …", "… counts as using a metallic item with regards to anathema.") and "Heightened (+2) The Hardness increases by 4, and
//   the Hit Points increase by 15."
// User decision: a temporary PF2e shield item on the target (PF2e's own Raise a Shield and Shield Block use it), with an Effect for the
// duration; removing either removes the other, and the spell ends when the shield's Hit Points are gone. (PF2e always gives a shield a
// Broken Threshold of half its maximum Hit Points, so the item carries twice the spell's Hit Points and the spell ends at that threshold.)
import { htmlToPlainText } from "./description-parser.js";

const RAISE = /^It can use the Raise a Shield action to instead raise its ([a-z]+), gaining a \+(\d) circumstance bonus to AC\.$/;
const BLOCK = /^It can Shield Block with its Raised ([a-z]+) as well; when it does, the target reduces the damage as if it had a shield with Hardness (\d+) and (\d+) Hit Points\.$/;
const NO_BT = /^This shield doesn't have a Broken Threshold, and the spell ends if the shield's Hit Points are expended\.$/;
const NOTES = [/^This spell doesn't modify the target's unarmed attacks and can't be used to make a shield bash Strike\.$/,
    /^Casting or coming under the effects of this spell also counts as using a [a-z]+ item with regards to anathema\.$/];
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The Hardness increases by (\d+), and the Hit Points increase by (\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?|Hardness|Hit Points)\b/i;

/** Returns {temporaryShield, claimed} or null. */
export function compileTemporaryShield(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || (adapted.damageComponents ?? []).length || (nativeSpellEffects?.references ?? []).length) return null;
    if (!/^(?:1|one) willing creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?(?: or until expended)?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const raiseAt = sentences.findIndex(sentence => RAISE.test(sentence));
    if (raiseAt < 0 || raiseAt > 1 || !BLOCK.test(sentences[raiseAt + 1] ?? "") || !NO_BT.test(sentences[raiseAt + 2] ?? "")) return null;
    if (sentences.slice(0, raiseAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const notes = sentences.slice(raiseAt + 3);
    if (notes.length > NOTES.length || notes.some(sentence => !NOTES.some(pattern => pattern.test(sentence)))) return null;
    const [, part, acBonus] = RAISE.exec(sentences[raiseAt]);
    const [, blockPart, hardness, hp] = BLOCK.exec(sentences[raiseAt + 1]);
    if (blockPart !== part || Number(acBonus) < 1 || Number(acBonus) > 3) return null;
    let heightening = null;
    if (rest.length) {
        const entries = [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
        const raised = entries.length === 1 ? HEIGHTENED.exec(entries[0]) : null;
        if (!raised) return null;
        heightening = { interval: Number(raised[1]), hardness: Number(raised[2]), hp: Number(raised[3]) };
    }
    return {
        temporaryShield: { part, acBonus: Number(acBonus), hardness: Number(hardness), hp: Number(hp), heightening, durationSeconds: Number(minutes[1]) * 60, notes, sourceText: sentences[raiseAt + 1] },
        claimed: sentences
    };
}

/** The shield's Hardness and Hit Points at a cast rank. */
export function temporaryShieldAt(shield, castRank, baseRank) {
    const steps = shield.heightening ? Math.max(0, Math.floor((castRank - baseRank) / shield.heightening.interval)) : 0;
    return { hardness: shield.hardness + steps * (shield.heightening?.hardness ?? 0), hp: shield.hp + steps * (shield.heightening?.hp ?? 0) };
}

export function isExecutableTemporaryShield(shield) {
    return Boolean(shield) && /^[a-z]+$/.test(shield.part ?? "") && Number.isInteger(shield.acBonus) && shield.acBonus >= 1 && shield.acBonus <= 3 && Number.isInteger(shield.hardness) && shield.hardness > 0
        && Number.isInteger(shield.hp) && shield.hp > 0 && Number.isInteger(shield.durationSeconds) && shield.durationSeconds > 0
        && (shield.heightening == null || (Number.isInteger(shield.heightening.interval) && shield.heightening.interval > 0 && Number.isInteger(shield.heightening.hardness) && Number.isInteger(shield.heightening.hp)));
}
