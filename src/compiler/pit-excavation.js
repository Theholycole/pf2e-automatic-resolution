// A pit dug under creatures (Expeditious Excavation):
//   "Area (continued) cube of dirt 5 feet across or smaller" / "You remove loose dirt, … up to the size of a 5-foot cube." / "Any Medium or
//   smaller creature standing atop the earth when the spell is cast must attempt a Reflex save or @Check[acrobatics] check." with the rows
//   Success (unaffected; descends without damage or moves to the nearest space), Failure (falls Prone in the nearest space, or into the pit if
//   it prefers) and Critical Failure (falls into the pit and lands prone, taking falling damage as normal), and "Heightened (+2) The spell can
//   excavate an additional 5-foot cube of earth. If you excavate all four 5-foot cubes beneath a Large creature, it must attempt a Reflex save or
//   Acrobatics check, as above."
// Rewritten to a degree save of the Medium or smaller creatures the caster targets on the dirt (Large from the rank four cubes are possible):
// Prone on a failure; Prone and the fall from the pit's 5 feet (half the distance, PF2e's falling damage) on a critical failure. That a creature
// may use Acrobatics instead, where it ends up, and a deeper pit of stacked cubes, are reminders.
import { htmlToPlainText } from "./description-parser.js";
import { SIZE_SLUGS_TO_LARGE as SIZES } from "./text-patterns.js";

const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*\(continued\) cube of dirt (\d+) feet across or smaller\s*<\/p>$/;
const REMOVE = /^You remove loose dirt, dust, gravel, sand, and the like \(though not solid stone\) up to the size of a (\d+)-foot cube\.$/;
const WHO = /^Any (Tiny|Small|Medium|Large) or smaller creature standing atop the earth when the spell is cast must attempt a (Fortitude|Reflex|Will) save or @Check\[(acrobatics|athletics)\] check\.$/;
const SUCCESS = /^The creature is unaffected and can choose to either descend the pit without damage or move to the nearest available space of its choice\.$/;
const FAILURE = /^The creature falls (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\}) in the nearest available space of its choice or falls into the pit if it prefers\.$/;
const CRITICAL = /^The creature falls into the pit excavated by the spell and lands prone, taking falling damage as normal\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The spell can excavate an additional (\d+)-foot cube of earth\. If you excavate all four \2-foot cubes beneath a Large creature, it must attempt a (Fortitude|Reflex|Will) save or (Acrobatics|Athletics) check, as above\.\s*<\/p>$/;

/** {html, target, sizeLimit, reminders, claimed} or null. */
export function extractPitExcavation(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3) return null;
    const area = AREA.exec(sections[0]), step = STEP.exec(sections[2]);
    if (!area || !step) return null;
    const paragraphs = [...sections[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 4) return null;
    const intro = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const row = (paragraph, name) => new RegExp(`^<strong>\\s*${name}\\s*<\\/strong>\\s*([\\s\\S]+)$`).exec(paragraph)?.[1]?.trim() ?? null;
    const [success, failure, critical] = [row(paragraphs[1], "Success"), row(paragraphs[2], "Failure"), row(paragraphs[3], "Critical Failure")];
    const remove = REMOVE.exec(intro[0] ?? ""), who = WHO.exec(intro[1] ?? "");
    if (intro.length !== 2 || !remove || !who || remove[1] !== area[1] || who[2].toLowerCase() !== adapted.defense.statistic) return null;
    const failed = FAILURE.exec(failure ?? "");
    if (!SUCCESS.test(success ?? "") || !failed || !CRITICAL.test(critical ?? "")) return null;
    if (step[2] !== area[1] || step[3] !== who[2] || step[4].toLowerCase() !== who[3]) return null;
    // The four cubes beneath a Large creature: the base cube and one more per step.
    const largeFromRank = Number(adapted.rank) + 3 * Number(step[1]);
    const depth = Number(area[1]), fall = Math.floor(depth / 2);
    const prone = failed[1], skill = who[3][0].toUpperCase() + who[3].slice(1);
    return {
        html: `<p>Each creature in the area must attempt a ${who[2]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature falls ${prone}.</p><p><strong>Critical Failure</strong> The creature falls ${prone} and takes @Damage[${fall}[bludgeoning]] damage.</p>`,
        target: "",
        sizeLimit: { size: SIZES[who[1]], byRank: { [largeFromRank]: "lg" } },
        reminders: [
            { kind: "save-or-skill", text: `Target the ${who[1]} or smaller creatures standing on the dirt. A creature may use ${skill} instead of the ${who[2]} save: set its result on the card. On a success it descends into the pit without damage or moves to the nearest space; on a failure it falls prone in the nearest space or into the pit if it prefers.`, sourceText: intro[1] },
            { kind: "surroundings", text: `The pit is ${depth} feet deep; the critical failure's fall is from ${depth} feet (${fall} bludgeoning). At heightened ranks the caster can excavate more cubes: a creature that falls farther takes half the extra distance too (add it). A Large creature saves only if all four cubes beneath it were excavated (from rank ${largeFromRank}); exclude it on the card otherwise.`, sourceText: htmlToPlainText(sections[2]).trim() }
        ],
        claimed: [htmlToPlainText(sections[0]).trim(), ...intro, htmlToPlainText(success), htmlToPlainText(failure), htmlToPlainText(critical), htmlToPlainText(sections[2]).trim()]
    };
}
