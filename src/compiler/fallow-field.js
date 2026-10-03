// A field that withholds healing (Fallow Field): "A sickly yellow light fills the area as entropic forces prevent healing. When a creature within the
// area would regain Hit Points, such as from a healing effect or an ability like fast healing or regeneration, it must attempt a Will save." with rows
// "The creature regains the full number of Hit Points that would be restored by the healing effect and is temporarily immune for 1 minute." / "The
// creature regains the full number of Hit Points that would be restored." / "The creature regains only half the number of Hit Points that would be
// restored." / "The creature doesn't regain Hit Points from the healing effect.": a sustained lingering area whose creatures, each time they would
// regain Hit Points while inside, save — the module holds the healing, rolls the save and restores the row's share (all, all, half, none); a critical
// success makes the creature immune for the minute.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = /^When a creature within the area would regain Hit Points, such as from a healing effect or an ability like fast healing or regeneration, it must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: /^The creature regains the full number of Hit Points that would be restored by the healing effect and is temporarily immune for (\d+) (minute|round)s?\.$/,
    success: /^The creature regains the full number of Hit Points that would be restored\.$/,
    failure: /^The creature regains only half the number of Hit Points that would be restored\.$/,
    criticalFailure: /^The creature doesn't regain Hit Points from the healing effect\.$/
};
const SHARE = { criticalSuccess: 1, success: 1, failure: 0.5, criticalFailure: 0 };
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** {html, healingSave, sentences} or null. */
export function rewriteFallowField(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const lead = LEAD.exec(sentences.at(-1) ?? "");
    if (!lead || sentences.length !== 2 || NARRATION_RULES.test(sentences[0]) || lead[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const found = Object.fromEntries(DEGREES.map(([degree, heading]) => [degree, ROWS[degree].exec(plain(heading))]));
    if (rows.length !== 4 || DEGREES.some(([degree]) => !found[degree])) return null;
    return {
        // (When it saves is the area's healing watch; the rows' shares are the declaration's.)
        html: `<p>${sentences[0]} A creature in the area must attempt a ${lead[1]} save.</p><hr />`
            + DEGREES.map(([, heading]) => `<p><strong>${heading}</strong> The creature is unaffected.</p>`).join(""),
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: Number(adapted.targeting.area.value) },
            centre: "placed", durationSeconds: Number(minutes[1]) * 60, sustained: true, concealment: false,
            healingSave: { statistic: lead[1].toLowerCase(), shares: { ...SHARE }, immunity: { degree: "criticalSuccess", value: Number(found.criticalSuccess[1]), unit: `${found.criticalSuccess[2]}s` } },
            sourceText: [sentences[1]] },
        sentences: [...sentences, ...DEGREES.map(([, heading]) => `${heading} ${plain(heading)}`)]
    };
}
