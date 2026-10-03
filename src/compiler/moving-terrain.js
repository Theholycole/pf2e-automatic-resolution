// A moving area whose movement batters the creatures it passes (Living Terrain):
//   "You transform an unoccupied @Template[type:burst|distance:10] of ground into a roiling cauldron of earth." / "When you Cast the Spell and the
//   first time you Sustain it each turn on subsequent rounds, you can move the living terrain up to 15 feet in a straight line along the ground;
//   you can't move it onto water or other liquids." / "Creatures in the area at any point during this movement take @Damage[4d6[bludgeoning]|…]
//   damage and must attempt a Reflex save as …" with rows "Critical Success The target takes no damage." / "Success … half damage and is
//   @UUID[…]{Clumsy 1} until the beginning of your next turn." / "Failure … full damage, is knocked @UUID[…]{Prone}, and is clumsy 1 until the
//   beginning of your next turn." / "Critical Failure … double damage, is knocked prone, and is @UUID[…]{Clumsy 2} until the beginning of your
//   next turn."
// The lingering area exposed when cast and on the first Sustain each turn (the creatures the GM confirms it passed over in the review); the GM
// moves the region. The rows written plainly.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = [
    /^You transform an unoccupied @Template\[(?:type:)?burst\|distance:(\d+)\] of ground into [a-z ,]+\.$/,
    /^When you Cast the Spell and the first time you Sustain it each turn on subsequent rounds, you can move the [a-z ]+ up to (\d+) feet in a straight line along the ground; you can't move it onto water or other liquids\.$/,
    /^Creatures in the area at any point during this movement take @Damage\[(\d+d\d+)\[([a-z]+)\](?:\|[^\]]*)?\] damage and must attempt an? (Fortitude|Reflex|Will) save(?: as [a-z ,]+)?\.$/
];
const ROWS = {
    criticalSuccess: /^The target takes no damage\.$/,
    success: new RegExp(String.raw`^The target takes half damage and is (${C}([A-Z][a-z]+) (\d)\}) until the beginning of your next turn\.$`),
    failure: new RegExp(String.raw`^The target takes full damage, is knocked (${C}Prone\}), and is ([a-z]+) (\d) until the beginning of your next turn\.$`),
    criticalFailure: new RegExp(String.raw`^The target takes double damage, is knocked prone, and is (${C}([A-Z][a-z]+) (\d)\}) until the beginning of your next turn\.$`)
};
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** {html, notes, claimed} or null. */
export function rewriteMovingTerrain(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || adapted.targeting?.area?.type !== "burst") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const paragraphs = [...`${body}${table}`.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const sentences = htmlToPlainText(`<p>${paragraphs[0] ?? ""}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 3 || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const radius = Number(LEAD[0].exec(sentences[0])[1]), feet = LEAD[1].exec(sentences[1])[1], [, dice, type, statistic] = LEAD[2].exec(sentences[2]);
    if (radius !== Number(adapted.targeting.area.value) || statistic.toLowerCase() !== adapted.defense.statistic
        || String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const text = paragraphs.slice(1).find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    if (paragraphs.length !== 5 || rows.failure[2] !== rows.success[2].toLowerCase() || rows.criticalFailure[2] !== rows.success[2]) return null;
    const [, low] = rows.success, prone = rows.failure[1], high = rows.criticalFailure[1];
    const until = "until the start of your next turn";
    return {
        html: `<p>When you Cast the Spell and the first time you Sustain it each turn on subsequent rounds, each creature in the area takes ${dice} ${type} damage and must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage and is ${low} ${until}.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is knocked ${prone}. The creature is ${low} ${until}.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and is knocked ${prone}. The creature is ${high} ${until}.</p>${rest.length ? `<hr />${rest.join("<hr />")}` : ""}`,
        notes: [`When you Cast the Spell and the first time you Sustain it each turn, you can move the area up to ${feet} feet in a straight line along the ground (not onto water or other liquids): move the region, and in the review include every creature it passed over.`],
        claimed: [...sentences, ...written]
    };
}
