// A wall that hurts whoever Strikes it (Wall of Mirrors): "You create a solid wall of shimmering reflective glass up to 50 feet long and 20 feet high. The wall
// is an inch thick and stands vertically. You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the
// spell is lost. Each 10-foot-by-10-foot section of the wall has AC 10, Hardness 10, and 40 Hit Points, and it's immune to critical hits and precision damage.
// Everything on each side of the wall is {Concealed} from creatures on the opposite side. If a creature Strikes the wall, the wall causes the creature to endure
// the mental anguish of that attack's pain as well; the creature takes 4d4 mental damage and can resist this damage with a basic Will save." with "Heightened (+1)
// The Hit Points of each section of the wall increase by 10." — the wall the GM draws; the card's control for a creature that Struck it posts its basic save of
// the item's damage; the sections' statistics and the concealment across it are notes.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You create a solid wall of [a-z ]+ up to (\d+) feet long and (\d+) feet high\.$/, /^The wall is an inch thick and stands vertically\.$/,
    /^You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost\.$/,
    /^Each (\d+)-foot-by-\d+-foot section of the wall has AC (\d+), Hardness (\d+), and (\d+) Hit Points, and it's immune to critical hits and precision damage\.$/,
    /^Everything on each side of the wall is (?:@UUID\[[^\]]+\]\{Concealed\}|concealed) from creatures on the opposite side\.$/,
    /^If a creature Strikes the wall, the wall causes the creature to endure the [a-z ']+ as well; the creature takes (\d+)d(\d+) ([a-z]+) damage and can resist this damage with a basic (Fortitude|Reflex|Will) save\.$/];
const STEP = /^Heightened \(\+(\d)\) The Hit Points of each section of the wall increase by (\d+)\.$/;

/** {struckWall, claimed} or null. */
export function compileStruckWall(adapted) {
    const components = adapted.damageComponents ?? [];
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || components.length !== 1) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const hurt = LEAD[5].exec(sentences[5]), section = LEAD[3].exec(sentences[3]), size = LEAD[0].exec(sentences[0]);
    if (`${hurt[1]}d${hurt[2]}` !== String(components[0].formula).replace(/\s+/g, "") || hurt[3] !== String(components[0].type).toLowerCase()) return null;
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (heightened.trim() && !step) return null;
    return { struckWall: { statistic: hurt[4].toLowerCase(), length: Number(size[1]), height: Number(size[2]),
            section: { feet: Number(section[1]), ac: Number(section[2]), hardness: Number(section[3]), hp: Number(section[4]), step: step ? { interval: Number(step[1]), add: Number(step[2]) } : null },
            notes: [sentences[1], sentences[2], sentences[4].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")] },
        claimed: [...sentences, ...(step ? [step[0]] : [])] };
}
