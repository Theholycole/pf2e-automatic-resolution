// A weapon charged to curse the next creature it hits (Mark of Blood):
//   "The next creature you successfully Strike with the weapon during the spell's duration takes damage as normal from the attack and must then
//   attempt a Will save; regardless of the outcome of this saving throw, the duration of mark of blood ends." / "You can have up to one creature
//   cursed by mark of blood at any one time." / "If you use this spell to mark a different creature, the curse afflicting the previous creature
//   ends." with the rows Critical Success (unaffected), Success (the mark — Concealed by clothing, otherwise permanent until the curse is
//   removed), Failure (as success, and the caster can Seek it: a Perception check against its Will DC gives its direction and general distance
//   within a mile when it's alive and on the same plane; a critical failure ends the curse) and Critical Failure (as failure, the Seek
//   automatically successful).
// Casting puts an Effect on the caster for the weapon (a held piercing or slashing one) for the duration. The weapon's next hit ends it and asks
// the struck creature's save (its card); the outcome gives the creature the mark (ending the caster's earlier mark), whose card's Seek rolls the
// Perception check (or succeeds) and whispers the direction and distance to the GM and the caster.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const NEXT = /^The next creature you successfully Strike with the weapon during the spell's duration takes damage as normal from the attack and must then attempt an? (Fortitude|Reflex|Will) save; regardless of the outcome of this saving throw, the duration of [a-z ]+ ends\.$/;
const ONE = /^You can have up to one creature cursed by [a-z ]+ at any one time\.$/;
const DIFFERENT = /^If you use this spell to mark a different creature, the curse afflicting the previous creature ends\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: /^The creature gains a softly glowing mark that resembles [A-Za-z']+ symbol somewhere on their body \(such as the forehead or back of the hand\)\. This mark can be (?:@UUID\[[^\]]+\]\{Concealed\}|concealed) by clothing, but is otherwise permanent until the curse is removed\.$/,
    failure: /^As success, but you can (?:@UUID\[[^\]]+\]\{Seek\}|Seek) to attempt to know the direction and general distance \(within a mile\) to the marked creature if the creature is alive and both you and the creature are on the same plane of existence\. When you Seek in this way, you attempt a Perception check against the marked creature's (Fortitude|Reflex|Will) DC\. On a success, you gain the information, which is accurate at the moment that you Seek\. On a critical failure, the curse ends, and the creature's mark vanishes\.$/,
    criticalFailure: /^As failure, but your Perception checks to Seek the marked creature are automatically successful\.$/
};
const HEADINGS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };

/** Returns {bloodMark, claimed} or null. */
export function compileBloodMark(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    if (!/^1 piercing or slashing weapon you're wielding$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => NEXT.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const next = NEXT.exec(sentences[at]);
    if (!ONE.test(sentences[at + 1]) || !DIFFERENT.test(sentences[at + 2]) || next[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const text = htmlToPlainText(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1] ?? "").replace(/\s+/g, " ").trim();
        if (!ROWS[degree].test(text)) return null;
        rows[degree] = text;
    }
    const seekAgainst = ROWS.failure.exec(rows.failure)[1].toLowerCase();
    return {
        bloodMark: { durationSeconds: Number(minutes[1]) * 60, statistic: adapted.defense.statistic, damageTypes: ["piercing", "slashing"],
            marks: { criticalSuccess: null, success: "none", failure: "check", criticalFailure: "auto" }, seek: { against: seekAgainst, withinFeet: 5280 },
            note: "The mark can be Concealed by clothing; it lasts until the curse is removed." },
        claimed: [...sentences.slice(at), ...Object.values(rows)]
    };
}
