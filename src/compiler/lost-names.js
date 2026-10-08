// Larger dice for the enemies whose victims the caster names (Remember the Lost): "Enemies in the area take 6d6 mental damage (basic Will save) and
// are @UUID[…]{Frightened 1} on a critical failure." / "If you know the names of anyone murdered or grievously wronged by an enemy in the area, you
// can chant those victims' names when you Cast the Spell to improve the clarity of the visions, increasing the damage to the corresponding enemy
// from 6d6 to @Damage[(2*(@item.level - 1))d10[mental]|shortLabel]; you can do so for multiple enemies if you know specific victims of each enemy."
// / "The visions are personal to each foe in the area, and you can't use this spell to discern a murderer by guessing a name." / "A creature that
// truly knows no one who died with any sort of grievance to that creature is immune to this effect." with "Heightened (+1) The damage increases by
// 2d6 (or 2d10 to an enemy when you name a specific victim).": the enemies' basic save with the critical failure's condition; for each enemy the
// caster answers on the card whether it named a victim (that enemy's damage is the larger roll, scaled by its result); the immunity the GM's
// confirmation for each creature; the guessing rule a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES } from "./text-patterns.js";

const LEAD = new RegExp(String.raw`^Enemies in the area take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) and are (${C}[A-Z][a-z]+ \d\}) on a critical failure\.$`);
const NAMES = /^If you know the names of anyone murdered or grievously wronged by an enemy in the area, you can chant those victims' names when you Cast the Spell to improve the clarity of the visions, increasing the damage to the corresponding enemy from (\d+d\d+) to @Damage\[(\(2\*\(@item\.level - (\d)\)\)d(\d+))\[([a-z]+)\](?:\|shortLabel)?\]; you can do so for multiple enemies if you know specific victims of each enemy\.$/;
const PERSONAL = /^The visions are personal to each foe in the area, and you can't use this spell to discern a murderer by guessing a name\.$/;
const IMMUNE = /^A creature that truly knows no one who died with any sort of grievance to that creature is immune to this effect\.$/;
const STEP = /^Heightened \(\+1\) The damage increases by (\d+d\d+) \(or (\d)d(\d+) to an enemy when you name a specific victim\)\.$/;

/** {html, upgrade, predicate, reminder, sentences} or null. */
export function rewriteLostNames(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 5 || NARRATION_RULES.test(sentences[0])) return null;
    const lead = LEAD.exec(sentences[1]), names = NAMES.exec(sentences[2]), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!lead || !names || !PERSONAL.test(sentences[3]) || !IMMUNE.test(sentences[4]) || !step) return null;
    const [, formula, type, statistic, condition] = lead;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || names[1] !== formula || names[5] !== type || step[3] !== names[4]
        // (The larger dice are 2 × (rank − N): 2 more each rank, as the step says.)
        || step[2] !== "2" || Number(adapted.rank) - Number(names[3]) < 1) return null;
    return {
        html: `<p>${sentences[0]} Enemies in the area take ${formula} ${type} damage with a basic ${statistic} save. A creature that critically fails its save also becomes ${condition}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        upgrade: { formula: `${names[2]}[${type}]`, type, question: "Did you chant the name of one of this enemy's victims? If so, its damage is the larger dice.",
            label: "enemies whose victims you named", sourceText: sentences[2] },
        predicate: { kind: "gm-confirmed", question: "Does this creature know anyone who died with a grievance toward it? (A creature that truly knows no one is immune.)", sourceText: sentences[4] },
        reminder: { kind: "spell-note", text: sentences[3], sourceText: sentences[3] },
        sentences
    };
}
