// Lines of starlight (Asterism): "Area (continued) five 30-foot lines" / "Lines of burning starlight form a constellation around you. Draw five lines, one at a time;
// each line must anchor at you or a creature or object already connected to a previous line, and it must end at a creature or object within 30 feet of its anchor …. A
// creature that begins its turn in one of these lines or enters one of these lines on its turn takes 4d6 fire damage (basic Reflex save). A creature can take this damage
// only once per turn, even if it moves through several lines. Targets that are part of the asterism do not take damage from it. If the distance between two targets (or
// you and a target) ever exceeds 30 feet, the line of starlight between the two breaks, and any lines that now no longer have a direct path back to you also break. You
// can Dismiss the spell.": the lines a lingering area whose region holds a shape for each line the GM draws; a creature starting its turn in one or entering one saves (once a turn); the
// asterism's own anchors and the breaking lines the GM's (a reminder).
import { htmlToPlainText } from "./description-parser.js";

const AREA = /^Area \(continued\) (two|three|four|five|six) (\d+)-foot lines$/;
const LEAD = /^Lines of burning starlight form a constellation around you\. (Draw (two|three|four|five|six) lines, one at a time; each line must anchor at you or a creature or object already connected to a previous line, and it must end at a creature or object within (\d+) feet of its anchor[^.]*\.) A creature that begins its turn in one of these lines or enters one of these lines on its turn takes (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\. A creature can take this damage only once per turn, even if it moves through several lines\. (Targets that are part of the asterism do not take damage from it\.) (If the distance between two targets \(or you and a target\) ever exceeds \d+ feet, the line of starlight between the two breaks, and any lines that now no longer have a direct path back to you also break\.) You can Dismiss the spell\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteStarLines(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "line") return null;
    const components = adapted.damageComponents ?? [];
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3) return null;
    const area = AREA.exec(htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim()), lead = LEAD.exec(htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim());
    if (!area || !lead || area[1] !== lead[2] || Number(area[2]) !== Number(adapted.targeting.area.value) || lead[6].toLowerCase() !== adapted.defense.statistic) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== lead[4] || String(components[0].type).toLowerCase() !== lead[5]) return null;
    return {
        html: `<p>A creature that enters the area or starts its turn in the area takes ${lead[4]} ${lead[5]} damage with a basic ${lead[6]} save. A creature can take this damage only once per turn. You can Dismiss the spell.</p><hr />${sections[2]}`,
        reminder: { kind: "spell-note", text: `Draw the ${area[1]} lines as shapes of the area's region (${lead[1].replace(/^Draw [a-z]+ lines, one at a time; each/, "each")}). ${lead[7]} — leave them out in the area review. ${lead[8]} (delete the broken lines' shapes from the region).`,
            sourceText: lead[0] },
        sentences: [htmlToPlainText(sections[0]).trim(), lead[0]]
    };
}
