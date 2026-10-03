// A placed area of magical darkness (Darkness):
//   "You create a shroud of darkness that prevents light from penetrating or emanating within the area." / "Light does not enter the area
//   and any non-magical light sources, such as a torch or lantern, do not emanate any light while inside the area, even if their light radius
//   would extend beyond the darkness." / "This also suppresses magical light of your darkness spell's rank or lower." / "Light can't pass
//   through, so creatures in the area can't see outside." / "From outside, it appears as a globe of pure darkness."
//   with "Heightened (4th) Even creatures with darkvision (but not greater darkvision) can barely see through the darkness. They treat targets
//   seen through the darkness as Concealed."
// Casting places the area and starts a lingering record for the duration whose region is fully dark (Foundry's darkness level override);
// the light sources inside, magical light of the cast rank or lower, and (from 4th) darkvision's concealment are the GM's notes.
import { htmlToPlainText } from "./description-parser.js";

const RULES = [
    /^You create a shroud of darkness that prevents light from penetrating or emanating within the area\.$/,
    /^Light does not enter the area and any non-magical light sources, such as a torch or lantern, do not emanate any light while inside the area, even if their light radius would extend beyond the darkness\.$/,
    /^This also suppresses magical light of your darkness spell's rank or lower\.$/,
    /^Light can't pass through, so creatures in the area can't see outside\.$/,
    /^From outside, it appears as a globe of pure darkness\.$/
];
const DARKVISION = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*(Even creatures with darkvision \(but not greater darkvision\) can barely see through the darkness\. They treat targets seen through the darkness as @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}\.)\s*<\/p>$/;

/** Returns {darknessArea, claimed} or null. */
export function compileDarknessArea(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained) return null;
    if (area?.type !== "burst" || !(Number(area.value) > 0)) return null;
    const fixed = /^(\d+) (round|minute|hour)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== RULES.length || !sentences.every((sentence, index) => RULES[index].test(sentence))) return null;
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    const heightened = [];
    for (const entry of entries) {
        const match = DARKVISION.exec(entry);
        if (!match) return null;
        heightened.push({ minRank: Number(match[1]), note: htmlToPlainText(match[2]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1") });
    }
    return {
        darknessArea: { area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()],
            darkness: { mode: 0, modifier: 1 },
            notes: ["Non-magical light sources inside the area emit no light, and light doesn't enter it: turn their lights off while inside.",
                "Magical light of the cast rank or lower is suppressed in the area."],
            heightened },
        claimed: [...sentences, ...heightened.map(entry => entry.note)]
    };
}
