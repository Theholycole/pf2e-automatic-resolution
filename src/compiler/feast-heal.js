// Damage in one area healing creatures in another (Blood-Feasting Breath): "Area (continued) two 30-foot cones" / "Like a vorpal dragon, you absorb
// life with an inhale and release it with an exhale." / "All living creatures in the first cone take 5d6 void damage with a basic Fortitude save." /
// "You and all living creatures in the second cone regain Hit Points equal to the greatest damage a single creature took from the first cone."
// with "Heightened (+1) The damage and healing increase by 1d6.": the first cone's basic save; after Finalize, the card heals the caster and the
// living creatures the GM targets in the second cone by the most any one creature lost (the healing follows the damage's heightening).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain|Hit Points)\b/i;
const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*\(continued\) two (\d+)-foot cones\s*<\/p>$/i;
const FIRST = /^All living creatures in the first cone take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const SECOND = /^You and all living creatures in the second cone regain Hit Points equal to the greatest damage a single creature took from the first cone\.$/;
const STEP = /^Heightened \(\+1\) The damage and healing increase by 1d(\d+)\.$/;

/** {html, healSpread, sentences} or null. */
export function rewriteFeastHeal(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "cone") return null;
    const components = adapted.damageComponents ?? [];
    const [area, body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const cones = AREA.exec(area ?? "");
    if (!cones || !body || rest.length || Number(cones[1]) !== Number(adapted.targeting.area.value)) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !SECOND.test(sentences[2])) return null;
    const first = FIRST.exec(sentences[1]), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!first || !step || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== first[1]
        || String(components[0].type).toLowerCase() !== first[2] || first[3].toLowerCase() !== adapted.defense.statistic || !first[1].endsWith(`d${step[1]}`)) return null;
    return {
        html: `<p>All living creatures in the area take ${first[1]} ${first[2]} damage with a basic ${first[3]} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        healSpread: { measure: "most-lost", caster: true, recipients: "living", sourceText: sentences[2] },
        sentences: [htmlToPlainText(area).trim(), ...sentences]
    };
}
