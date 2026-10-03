// A wall of burning light (Wall of Radiance): "You create a thin wall of brilliant light in a straight line up to 60 feet long and 10 feet high. You must create the
// wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost. The wall stands vertically and, if you wish, can be of
// a shorter length or height. Creatures adjacent to the wall are Dazzled. Creatures that move through the wall take 2d6 fire damage (basic Fortitude save) as the
// concentrated light burns them." with "Heightened (4th) The light makes it difficult to discern creatures on the other side. Creatures are Concealed to other creatures
// on the opposite side of the wall from them. The fire damage increases to 3d6.": the wall a lingering line the GM places (up to the stated length), each creature
// moving into it saving against the damage (PF2e's entry, heightened); the dazzle beside it and the heightened concealment a reminder.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You create a thin wall of brilliant light in a straight line up to (\d+) feet long and (\d+) feet high\. (You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost\.) (The wall stands vertically and, if you wish, can be of a shorter length or height\.) Creatures adjacent to the wall are (?:@UUID\[[^\]]+\]\{Dazzled\}|Dazzled)\. Creatures that move through the wall take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) as the concentrated light burns them\.$/;
const HEIGHTENED = /^Heightened \((\d)th\) The light makes it difficult to discern creatures on the other side\. (Creatures are (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed) to other creatures on the opposite side of the wall from them\.) The fire damage increases to (\d+d\d+)\.$/;

/** {html, area, reminder, sentences} or null. */
export function rewriteRadiantWall(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim()), lift = HEIGHTENED.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!lead || !lift || lead[7].toLowerCase() !== adapted.defense.statistic) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== lead[5] || String(components[0].type).toLowerCase() !== lead[6]) return null;
    return {
        html: `<p>A creature that enters the wall takes ${lead[5]} ${lead[6]} damage with a basic ${lead[7]} save.</p><hr />${heightened}`,
        area: { type: "line", value: Number(lead[1]) },
        reminder: { kind: "spell-note", text: `Place the wall as a line region (up to ${lead[1]} feet long and ${lead[2]} feet high; ${lead[3].replace(/^You must create/, "it must stand").replace(/\.$/, "")}). Creatures adjacent to it are Dazzled. At ${lift[1]}th rank or higher, ${lift[2].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/^Creatures/, "creatures")}`,
            sourceText: lead[0] },
        sentences: [lead[0], lift[0]]
    };
}
