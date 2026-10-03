// An object taken apart for a while (Dismantle; user decision 2026-10-01: an object's result is the card's, the GM applies the rest):
//   "The object gains the Broken condition, and the component pieces become small enough to be Hidden under normal clothing and armor." / "When
//   the spell ends, the object reassembles itself …" / "Once reassembled, the object loses the Broken condition and its Hit Points return to the
//   value the object had when you Cast the Spell." with "Heightened (4th) The spell lasts for 10 minutes." / "Heightened (6th) The spell lasts
//   until your next daily preparations."
// The caster picks the item (non-magical, at most the stated Bulk); it's Broken (its Hit Points at its Broken Threshold) until the caster's Effect
// ends (Dismiss, or the duration at the cast rank); then its Hit Points are restored. Hiding the pieces, the failure cases and where it
// reappears are the GM's.
import { htmlToPlainText } from "./description-parser.js";
import { parseHeightenedDurations } from "./heightened-duration-compiler.js";

const SENTENCES = [
    /^You touch an object, and it immediately disassembles itself into its component pieces\.$/,
    /^The spell fails if the target lacks component pieces \(such as a statue carved from one block of stone\), and using it on a dangerous object like a snare or trap typically triggers it\.$/,
    /^The object gains the (?:@UUID\[[^\]]+\]\{Broken\}|Broken) condition, and the component pieces become small enough to be (?:@UUID\[[^\]]+\]\{Hidden\}|Hidden) under normal clothing and armor\.$/,
    /^You can (?:@UUID\[[^\]]+\]\{Dismiss\}|Dismiss) the spell\.$/,
    /^When the spell ends, the object reassembles itself into its original form, appearing in your hand or hands if you have them free, or on the ground in front of you otherwise\.$/,
    /^Once reassembled, the object loses the Broken condition and its Hit Points return to the value the object had when you (?:@UUID\[[^\]]+\]\{Cast the Spell\}|Cast the Spell)\.$/
];

/** Returns {dismantle, claimed} or null. */
export function compileDismantle(adapted) {
    const target = /^1 non-magical object in your possession of (\d+) Bulk or less$/i.exec(String(adapted.targeting?.target ?? "").trim());
    const fixed = /^(\d+) (minute|hour)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (adapted.defense?.kind !== "none" || !target || !fixed || adapted.targeting?.area) return null;
    const [body] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== SENTENCES.length || !sentences.every((sentence, index) => SENTENCES[index].test(sentence))) return null;
    const unit = `${fixed[2].toLowerCase()}s`;
    const parsed = parseHeightenedDurations(adapted.descriptionHTML, { baseRank: adapted.rank, baseDuration: { mode: "fixed", value: Number(fixed[1]), unit } });
    if (parsed?.unsupported?.length) return null;
    return {
        dismantle: { maxBulk: Number(target[1]), duration: { value: Number(fixed[1]), unit }, heightenedDurations: parsed?.entries ?? [],
            note: `${sentences[1]} The pieces can be Hidden under normal clothing and armor. ${sentences[4]}` },
        claimed: sentences
    };
}
