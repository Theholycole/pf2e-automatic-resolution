// A sustained save whose Sustain frightens the target's allies (Warped Visage): "Failure The target is Enfeebled 1 for the duration. The first time you
// Sustain the spell each turn, one of the target creature's allies within 30 feet of the target must attempt a @Check[type:will|dc:resolve(…)] or become
// Frightened 1; or Frightened 2 on a critical failure. A creature targeted by this effect is then temporarily immune for 10 minutes." and "Critical Failure
// As failure, but the target is Enfeebled 2 and creatures do not treat the target as an ally while frightened.": the target's rows (its condition for the
// spell's duration), and on the first Sustain each turn a save card for one ally within the distance of a target that failed — its own plan, with the
// immunity; the critical failure's "not an ally" a GM note.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.([A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = /^(.+?) The creature must attempt an? (Fortitude|Reflex|Will) save\.$/;
const FAILURE = new RegExp(String.raw`^The target is ${C} for the duration\. (The first time you Sustain the spell each turn, one of the target creature['’]s allies within (\d+) feet of the target must attempt a @Check\[(?:type:)?(fortitude|reflex|will)\|dc:resolve\(@actor\.attributes\.spellDC\.value\)\] or become ${C}; or ${C} on a critical failure\.) (A creature targeted by this effect is then temporarily immune for (\d+) (minute|hour)s\.)$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the target is ${C} and (creatures do not treat the target as an ally while frightened)\.$`);

/** {mainHTML, followHTML, ally: {radius, statistic}, note, sentences} or null. */
export function extractSustainAllySave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || adapted.targeting?.area
        || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\s*\/?>/i.test(html)) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? null;
    const lead = LEAD.exec(htmlToPlainText(paragraphs[0] ?? "").replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4 || !lead || NARRATION_RULES.test(lead[1]) || lead[2].toLowerCase() !== adapted.defense.statistic || row("Critical Success") !== null
        || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Success") ?? ""))) return null;
    const failure = FAILURE.exec(row("Failure") ?? ""), critical = CRITICAL.exec(row("Critical Failure") ?? "");
    if (!failure || !critical) return null;
    const [, condId, condName, condValue, sustainText, radius, statistic, f1Id, f1Name, f1Value, f2Id, f2Name, f2Value, immunityText, amount, unit] = failure;
    const [, critId, critName, critValue, notAlly] = critical;
    // (The same condition, one step worse on the critical failure; the ally's two rows the same condition at 1 and 2.)
    if (condId !== critId || condName !== critName || Number(critValue) !== Number(condValue) + 1 || f1Id !== f2Id || f1Name !== f2Name || f1Value !== "1" || f2Value !== "2") return null;
    const link = (id, name, value) => `@UUID[Compendium.pf2e.conditionitems.Item.${id}]{${name} ${value}}`;
    const Statistic = statistic[0].toUpperCase() + statistic.slice(1);
    return {
        mainHTML: `<p>The creature must attempt a ${lead[2]} save.</p><p><strong>Success</strong> The target is unaffected.</p>`
            // (Its condition lasts as long as the sustained spell: the Ongoing record holds it.)
            + `<p><strong>Failure</strong> The target is ${link(condId, condName, condValue)}.</p><p><strong>Critical Failure</strong> The target is ${link(critId, critName, critValue)}.</p>`,
        followHTML: `<p>Each creature in the area must attempt a ${Statistic} save. Afterward, the creature is temporarily immune for ${amount} ${unit}s.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${link(f1Id, f1Name, f1Value)}.</p><p><strong>Critical Failure</strong> The creature is ${link(f2Id, f2Name, f2Value)}.</p>`,
        ally: { radius: Number(radius), statistic },
        note: `${notAlly[0].toUpperCase()}${notAlly.slice(1)} (the target's critical failure; the GM plays it).`,
        sentences: [htmlToPlainText(sustainText), htmlToPlainText(immunityText), htmlToPlainText(row("Critical Failure"))]
    };
}
