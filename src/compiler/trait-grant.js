// A degree save for some creatures in the area and a condition for creatures of a trait, with no save (Deathless March):
//   "Undead creatures within the area gain the Quickened condition for 1 minute, which they can use only to Stride." / "Living creatures in the
//   area must attempt a Will save." / "This gains the emotion, fear, and mental traits for living creatures."
// The creatures with the trait get the condition (an Effect, its use limited by a note) and don't save; the saving creatures are the stated
// ones (living); the traits the spell gains for them are the GM's reminder (immunities and bonuses against those traits).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const GRANT = /^([A-Z][a-z]+) creatures within the area gain the @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\} condition for (\d+) (round|minute)s?, which they can use only to ([A-Z][a-z]+)\.$/;
const SAVERS = /^(Living) creatures in the area must attempt an? (Fortitude|Reflex|Will) save\.$/;
const GAINS = /^This gains the ([a-z]+(?:, [a-z]+)*,? and [a-z]+) traits for living creatures\.$/;

/** {html, traitGrant, reminder, predicate, sentences} or null. */
export function rewriteTraitGrant(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const at = html.search(/<hr\s*\/?>/i);
    if (at < 0) return null;
    const sentences = htmlToPlainText(html.slice(0, at)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const grantAt = sentences.findIndex(sentence => GRANT.test(sentence));
    if (grantAt < 0 || sentences.length !== grantAt + 3) return null;
    const grant = GRANT.exec(sentences[grantAt]), savers = SAVERS.exec(sentences[grantAt + 1]), gains = GAINS.exec(sentences[grantAt + 2]);
    if (!savers || !gains || savers[2].toLowerCase() !== adapted.defense.statistic || sentences.slice(0, grantAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const unit = grant[5] === "round" ? "rounds" : "minutes";
    return {
        html: `<p>${[...sentences.slice(0, grantAt), sentences[grantAt + 1]].join(" ")}</p>${html.slice(at)}`,
        traitGrant: { trait: grant[1].toLowerCase(), uuid: grant[2], slug: grant[3].toLowerCase(), label: grant[3], duration: { value: Number(grant[4]), unit },
            note: `${grant[3]}: the extra action can be used only to ${grant[6]}.`, sourceText: sentences[grantAt] },
        reminder: { kind: "trait-note", text: `For living creatures this spell has the ${gains[1]} traits: their immunities and bonuses against those traits apply.`, sourceText: sentences[grantAt + 2] },
        predicate: { kind: "living-creature" },
        sentences: sentences.slice(grantAt)
    };
}
