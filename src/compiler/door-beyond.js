// A door to outside reality (Door to Beyond): "Striking at thin air, you create hairline cracks in an unoccupied adjacent space that lead somewhere outside
// reality. Air rushes through the cracks, drawing Large or smaller creatures and objects of light Bulk or less toward the center. Large or smaller creatures in
// the area must attempt a Fortitude save at the start of their turn; creatures that move into the area must attempt the save upon entering." / "The cracks of
// the door to beyond are too thin for anything to fully slip through, but decompressive effects deal 4d6 slashing damage to any creature or object that ends
// its turn adjacent to the door. You are unaffected by your own door to beyond. You can Dismiss the spell." with rows "The creature is unaffected." / "The
// creature is pulled 10 feet toward the door." / "… 20 feet toward the door." and "Heightened (+1) The damage increases by 1d6.": a placed 20-foot emanation
// around the door (the GM places it on the space), the caster out of it; Large or smaller creatures saving as their turns begin or on entering, pulled toward
// the centre; the squares adjacent to the door a second area whose creatures (not the caster) take PF2e's slashing at the cast rank as their turns end; the
// objects a reminder; Dismiss.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const DRAW = /^Air rushes through the cracks, drawing (Large) or smaller creatures and (objects of light Bulk or less) toward the center\.$/;
const WHO = /^(Large) or smaller creatures in the area must attempt an? (Fortitude|Reflex|Will) save at the start of their turn; creatures that move into the area must attempt the save upon entering\.$/;
const THIN = /^The cracks of the [a-z ]+ are too thin for anything to fully slip through, but decompressive effects deal (\d+)d(\d+) ([a-z]+) damage to any creature or object that ends its turn adjacent to the door\.$/;
const SELF = /^You are unaffected by your own [a-z ]+\.$/;
const DISMISS = /^You can Dismiss the spell\.$/;
const ROWS = { success: /^The creature is unaffected\.$/, failure: /^The creature is pulled (\d+) feet toward the door\.$/, criticalFailure: /^The creature is pulled (\d+) feet toward the door\.$/ };
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d)d(\d+)\.$/;

/** {html, hazard, notes, sentences} or null. */
export function rewriteDoorBeyond(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation") return null;
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 2) return null;
    const paragraphs = [...sections[0].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    // (The rows follow the two paragraphs without a rule.)
    if (paragraphs.length !== 5) return null;
    const split = text => text.split(/(?<=[.!?;])\s+(?=[A-Z@])/).filter(Boolean);
    const first = split(paragraphs[0]), second = split(paragraphs[1]);
    const draw = DRAW.exec(first[1] ?? ""), who = WHO.exec(first[2] ?? ""), thin = THIN.exec(second[0] ?? ""), step = STEP.exec(htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim());
    const row = (heading, text) => new RegExp(String.raw`^${heading} `).test(text) ? text.slice(heading.length + 1) : null;
    const success = row("Success", paragraphs[2]), failure = row("Failure", paragraphs[3]), critical = row("Critical Failure", paragraphs[4]);
    const pulled = { failure: ROWS.failure.exec(failure ?? ""), criticalFailure: ROWS.criticalFailure.exec(critical ?? "") };
    if (first.length !== 3 || NARRATION_RULES.test(first[0]) || !draw || !who || second.length !== 3 || !thin || !SELF.test(second[1]) || !DISMISS.test(second[2])
        || !ROWS.success.test(success ?? "") || !pulled.failure || !pulled.criticalFailure || !step || who[2].toLowerCase() !== adapted.defense.statistic) return null;
    const [, dice, die, type] = thin;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `${dice}d${die}` || String(components[0].type).toLowerCase() !== type
        || step[3] !== die) return null;
    return {
        html: `<p>${first[0]} A creature that enters or starts its turn in the area must attempt a ${who[2]} save. You can Dismiss the spell.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature moves ${pulled.failure[1]} feet toward the center.</p><p><strong>Critical Failure</strong> The creature moves ${pulled.criticalFailure[1]} feet toward the center.</p>`,
        size: who[1].toLowerCase() === "large" ? "lg" : null,
        hazard: { dice: Number(dice), die: Number(die), type, heightening: { interval: Number(step[1]), dice: Number(step[2]) }, baseRank: Number(adapted.rank) || 1, label: "decompression at the door", sourceText: second[0] },
        notes: [`${draw[2][0].toUpperCase()}${draw[2].slice(1)} are drawn toward the door too; objects ending a turn adjacent to it take the slashing damage (the GM's). Place the area on the door's space.`],
        sentences: [...first, ...second, `Success ${success}`, `Failure ${failure}`, `Critical Failure ${critical}`, htmlToPlainText(sections[1]).trim()]
    };
}
