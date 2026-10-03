// A wave rushing away from the caster, then on again at the start of its next turn (Sea Surge):
//   "The water forms a flat, 5-foot-thick, 10-foot-high wall of water between 5 and 15 feet wide (you decide)." / "It moves 60 feet in a
//   direction of your choice along the struck surface, extinguishing all non-magical fires, carrying along unattended objects of 1 Bulk or less,
//   and pushing larger objects." / "The wave moves another 60 feet in the same direction at the start of your next turn, then vanishes." /
//   "Large or smaller creatures in the area or that enter the area the wave moves through must attempt a Fortitude save." with the rows Success
//   (unaffected), Failure (knocked Prone; a Swimming creature gets a critical failure instead) and Critical Failure (pushed 20 feet in the
//   wave's direction, knocked Prone, and takes 3d6 bludgeoning damage).
// Rewritten to a degree save of the Large or smaller creatures in the wave's path (the GM places the 60-foot line; its width is the caster's):
// Prone on a failure, the damage, the push away from the caster and Prone on a critical failure; the GM says whether each was Swimming (a failure
// becomes a critical failure). A card moves the wave on at the start of the caster's next turn: the GM places its next 60 feet, and the
// creatures there save the same way.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const WALL = /^The water forms a flat, \d+-foot-thick, \d+-foot-high wall of water between \d+ and \d+ feet wide \(you decide\)\.$/;
const MOVES = /^It moves (\d+) feet in a direction of your choice along the struck surface, extinguishing all non-magical fires, carrying along unattended objects of \d+ Bulk or less, and pushing larger objects\.$/;
const AGAIN = /^The wave moves another (\d+) feet in the same direction at the start of your next turn, then vanishes\.$/;
const WHO = /^(Tiny|Small|Medium|Large|Huge) or smaller creatures in the area or that enter the area the wave moves through must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    success: /^The creature is unaffected\.$/,
    failure: /^The creature is knocked (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\. If the creature was Swimming, it gets a critical failure instead\.$/,
    criticalFailure: /^The creature is pushed (\d+) feet in the wave's direction, is knocked Prone, and takes (\d+d\d+) ([a-z]+) damage\.$/
};
const SIZES = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge" };

/** {html, area, sizeLimit, degreeAdjustment, reminder, waveRepeat, sentences} or null. */
export function extractWaveSurge(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !/^until the start of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || components.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => WALL.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const moves = MOVES.exec(sentences[at + 1]), again = AGAIN.exec(sentences[at + 2]), who = WHO.exec(sentences[at + 3]);
    if (!moves || !again || !who || who[2].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [degree, heading] of [["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const text = htmlToPlainText(new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table)?.[1] ?? "").replace(/\s+/g, " ").trim();
        rows[degree] = ROWS[degree].exec(text);
        if (!rows[degree]) return null;
    }
    if (/<strong>\s*Critical Success/i.test(table)) return null;
    const [, feet, dice, type] = rows.criticalFailure;
    if (dice !== String(components[0].formula).replace(/\s+/g, "") || type !== String(components[0].type).toLowerCase()) return null;
    const prone = rows.failure[1];
    return {
        html: `<p>Each creature in the area must attempt a ${who[2]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is knocked ${prone}.</p><p><strong>Critical Failure</strong> The creature takes full damage, is pushed ${feet} feet away from you, and is knocked ${prone}.</p>`,
        area: { type: "line", value: Number(moves[1]) },
        sizeLimit: SIZES[who[1]],
        degreeAdjustment: { predicate: { kind: "gm-confirmed", question: "Was the creature Swimming? If so, a failure is a critical failure." },
            map: { criticalSuccess: "criticalSuccess", success: "success", failure: "criticalFailure", criticalFailure: "criticalFailure" }, sourceText: rows.failure[0] },
        reminder: { kind: "surroundings", text: `${sentences[at]} ${sentences[at + 1]} Place the line along the wave's path (widen it to the wall's width); fires and objects are the GM's.`, sourceText: sentences[at + 1] },
        waveRepeat: { feet: Number(again[1]), when: "caster-turn-start", sourceText: sentences[at + 2] },
        sentences: [...sentences.slice(at), rows.success[0], rows.failure[0], rows.criticalFailure[0]]
    };
}
