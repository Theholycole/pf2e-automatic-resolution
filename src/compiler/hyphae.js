// A tremorsense web that also lets the caster Strike with plants (Fungal Hyphae):
//   "Thin hyphae grow from your feet …, creating a symbiotic fungal network that attaches to plants within 30 feet …" / "You gain an imprecise
//   tremorsense, allowing you to sense anything directly touching plants within that distance." / "If you move, the hyphae snap, and the spell
//   ends." / "Heightened (4th) … you use a Strike action, but you can Strike any creature you can detect with your tremorsense. These are spell
//   attacks that deal @Damage[3d8[bludgeoning]] damage. …" / "Heightened (6th) As 4th rank, but you can use other simple manipulate actions through
//   the plants, …"
// An Effect on the caster with the sense, removed when its token moves; from the 4th rank its Ongoing control makes a plant Strike (the spell
// attack against the targeted creature's AC, the damage on a hit, doubled on a critical hit). What plants can do otherwise is the note.
import { htmlToPlainText } from "./description-parser.js";

const WEB = /^Thin hyphae grow from your feet and plunge into the earth, creating a symbiotic fungal network that attaches to plants within (\d+) feet and connects you to their root systems\.$/;
const SENSE = /^You gain an (imprecise|precise) (tremorsense), allowing you to sense anything directly touching plants within that distance\.$/;
const MOVE = /^If you move, the hyphae snap, and the spell ends\.$/;
const STRIKES = /^You can control plants in the area to a small degree, allowing you to make Strikes with tree branches, exposed roots, or similarly solid plants\. To do so, you use a Strike action, but you can Strike any creature you can detect with your tremorsense\. These are spell attacks that deal @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\. (Unusual plants, such as thorny vines, might deal a different type of damage at the GM's discretion\. You can't make any other attacks through these plants, or take any other actions through them, other than these Strikes\.)$/;
const MANIPULATE = /^As 4th rank, but (you can use other simple manipulate actions through the plants, including having a branch pick an object up or open a door, though more complex actions, such as picking a lock or disabling a trap, remain impossible\.)$/;

/** Returns {hyphae, claimed} or null. */
export function compileHyphae(adapted) {
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || !fixed || (adapted.damageComponents ?? []).length) return null;
    const [body, rest = ""] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3) return null;
    const web = WEB.exec(sentences[0]), sense = SENSE.exec(sentences[1]);
    if (!web || !sense || !MOVE.test(sentences[2])) return null;
    const entries = [...rest.matchAll(/<p>\s*<strong>\s*Heightened \((\d)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => ({ rank: Number(match[1]), text: htmlToPlainText(match[2]).replace(/\s+/g, " ").trim() }));
    if (entries.length !== 2) return null;
    const strikes = STRIKES.exec(entries[0].text), manipulate = MANIPULATE.exec(entries[1].text);
    if (!strikes || !manipulate || entries[1].rank <= entries[0].rank) return null;
    return {
        hyphae: { sense: { selector: sense[2], acuity: sense[1], range: Number(web[1]) }, durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60),
            strikes: { fromRank: entries[0].rank, formula: strikes[1], type: strikes[2], note: strikes[3] }, manipulate: { fromRank: entries[1].rank, note: manipulate[1] } },
        claimed: [...sentences, entries[0].text, entries[1].text]
    };
}
