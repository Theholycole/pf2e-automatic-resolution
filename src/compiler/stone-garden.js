// A stalagmite raised from below (Garden of Stone): "The ground shakes as you conjure a 10-foot-tall stalagmite from below. The stalagmite fills the area and has AC
// 10, Hardness 5, and 30 Hit Points. When you Cast the Spell, all creatures in the area take 3d10 piercing damage, with a basic Reflex save, and are pushed to the
// nearest unoccupied space as the stalagmite rises. The area in a @Template[type:emanation|distance:20] around the stalagmite becomes difficult terrain, as smaller
// stalagmites grow around it." / "If the stalagmite survives to the end of the spell's duration, it remains as an ordinary, non-magical stalagmite. …" with
// "Heightened (+1) The stalagmite has an additional 10 Hit Points, and the damage increases by 1d10.": the basic save at the cast; the push, the terrain and the
// stalagmite (its HP at the cast rank) a reminder.
import { htmlToPlainText } from "./description-parser.js";

const FIRST = /^The ground shakes as you conjure a (\d+)-foot-tall stalagmite from below\. The stalagmite fills the area and has AC (\d+), Hardness (\d+), and (\d+) Hit Points\. When you Cast the Spell, all creatures in the area take (\d+d\d+) ([a-z]+) damage, with a basic (Fortitude|Reflex|Will) save, and are pushed to the nearest unoccupied space as the stalagmite rises\. The area in a @Template\[type:emanation\|distance:(\d+)\] around the stalagmite becomes difficult terrain, as smaller stalagmites grow around it\.$/;
const SECOND = /^If the stalagmite survives to the end of the spell's duration, it remains as an ordinary, non-magical stalagmite\. However, [^.]+\.$/;
const STEP = /^Heightened \(\+1\) The stalagmite has an additional (\d+) Hit Points, and the damage increases by 1d(\d+)\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteStoneGarden(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst") return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const first = FIRST.exec(paragraphs[0] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2 || !first || !SECOND.test(paragraphs[1]) || !step || first[7].toLowerCase() !== adapted.defense.statistic || !first[5].endsWith(`d${step[2]}`)) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== first[5] || String(components[0].type).toLowerCase() !== first[6]) return null;
    return {
        html: `<p>You deal ${first[5]} ${first[6]} damage to all creatures in the area, with a basic ${first[7]} save.</p><hr />${heightened}`,
        reminder: { kind: "spell-note", text: `Push each creature in the area to the nearest unoccupied space. A ${first[1]}-foot-tall stalagmite fills the area (AC ${first[2]}, Hardness ${first[3]}, ${first[4]} Hit Points, +${step[1]} per rank above ${adapted.rank}); the ${first[8]}-foot emanation around it is difficult terrain while the spell lasts (mark it). If the stalagmite survives the duration, it stays as an ordinary stalagmite.`,
            sourceText: paragraphs[0] },
        sentences: [...paragraphs, step[0]]
    };
}
