// An area that slams flying creatures down (Falling Sky): "Area 60-foot tall, 30-foot radius cylinder" / "All flying creatures in the area descend to the bottom
// of the spell's area, taking twice as much bludgeoning damage as if they had fallen the distance moved, to a maximum of 60 falling damage if they fall 60 feet.
// They take this falling damage even if the spell's area is entirely in the air and they don't hit the ground, as they concuss against the bottom of the
// spell's area at great speed. Creatures on the ground and within the spell's area, including flying creatures forced to the ground, must attempt Fortitude
// saves." with "Critical Success The creature is unaffected, and if it was flying, it isn't knocked {Prone} even though it took falling damage." / "Success The
// creature is knocked prone." / "Failure The creature is knocked prone and {Stunned 2}." / "Critical Failure The creature is knocked prone and stunned for 1 round."
// — every creature on the card saves (the rows: Prone; Prone and Stunned 2; Prone and Stunned for 1 round); each one above the ground (its token's elevation)
// descends to it and takes twice the falling damage for that distance (the distance itself, PF2e's falling damage being half), to the stated maximum, whatever
// its save. The area's bottom is the ground: a raised area is the GM's (the card's reminder).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const AREA = /^Area (\d+)-foot tall, (\d+)-foot radius cylinder$/;
const DESCEND = /^All flying creatures in the area descend to the bottom of the spell's area, taking twice as much ([a-z]+) damage as if they had fallen the distance moved, to a maximum of (\d+) falling damage if they fall \2 feet\.$/;
const EVEN_IN_AIR = /^They take this falling damage even if the spell's area is entirely in the air and they don't hit the ground, as they concuss against the bottom of the spell's area at great speed\.$/;
const ALL_SAVE = /^Creatures on the ground and within the spell's area, including flying creatures forced to the ground, must attempt (Fortitude|Reflex|Will) saves\.$/;
const CRIT_SUCCESS = new RegExp(String.raw`^The creature is unaffected, and if it was flying, it isn't knocked ${C}Prone\} even though it took falling damage\.$`);
const SUCCESS = /^The creature is knocked prone\.$/;
const FAILURE = new RegExp(String.raw`^The creature is knocked prone and ${C}Stunned (\d)\}\.$`);
const CRITICAL = /^The creature is knocked prone and stunned for (\d+) rounds?\.$/;

/** {html, areaFall, reminder, sentences} or null. */
export function rewriteFallingArea(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "cylinder" || (adapted.damageComponents ?? []).length) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3) return null;
    const [areaHTML, body, table] = sections;
    const area = AREA.exec(htmlToPlainText(areaHTML).replace(/\s+/g, " ").trim());
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (!area || Number(area[2]) !== Number(adapted.targeting.area.value) || sentences.length !== 4 || /\d|@/.test(sentences[0])) return null;
    const descend = DESCEND.exec(sentences[1]), save = ALL_SAVE.exec(sentences[3]);
    if (!descend || !EVEN_IN_AIR.test(sentences[2]) || !save || save[1].toLowerCase() !== adapted.defense.statistic || Number(descend[2]) > Number(area[1])) return null;
    const rows = Object.fromEntries([...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [match[1], match[2].replace(/\s+/g, " ").trim()]));
    const critSuccess = CRIT_SUCCESS.exec(rows["Critical Success"] ?? ""), failure = FAILURE.exec(rows.Failure ?? ""), critical = CRITICAL.exec(htmlToPlainText(rows["Critical Failure"] ?? "").trim());
    if (!critSuccess || !SUCCESS.test(htmlToPlainText(rows.Success ?? "").trim()) || !failure || !critical) return null;
    const prone = `@UUID[${critSuccess[1]}]{Prone}`, stunned = `@UUID[${failure[1]}]{Stunned}`;
    const statistic = save[1];
    return {
        html: `<p>${sentences[0]} Each creature in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is knocked ${prone}.</p>`
            + `<p><strong>Failure</strong> The creature is knocked ${prone} and @UUID[${failure[1]}]{Stunned ${failure[2]}}.</p>`
            + `<p><strong>Critical Failure</strong> The creature is knocked ${prone} and ${stunned} for ${critical[1]} round${critical[1] === "1" ? "" : "s"}.</p>`,
        areaFall: { multiplier: 2, cap: Number(descend[2]), type: descend[1], sourceText: sentences[1] },
        reminder: { kind: "spell-note", text: "Each creature above the ground falls to it and takes the falling damage (twice normal, the distance itself, at most 60). If the area's bottom is in the air, the GM adjusts the distance and the creature's elevation.", sourceText: sentences[2] },
        sentences: [htmlToPlainText(areaHTML).trim(), ...sentences, ...Object.entries(rows).map(([heading, text]) => `${heading} ${htmlToPlainText(text).trim()}`)]
    };
}
