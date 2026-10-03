// A scene the caster pays for when it ends (Ghostly Tragedy): "Once the scene ends, you take @Damage[2d6[void]] damage for each ghostly apparition
// that participated in the scene (typically equal to the number of creatures involved other than the victim)." with the scene's narration and "Any
// creature that observed the ghostly recreation, including you, can attempt checks to investigate the event …": the caster's Effect for the spell's
// duration; its End the scene control asks the GM how many took part and deals the caster the dice once per each; the scene and the
// investigation are notes.
import { htmlToPlainText } from "./description-parser.js";

const COST = /^Once the scene ends, you take @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage for each ([a-z ]+) that participated in the scene \(typically ([^)]+)\)\.$/;
const OBSERVE = /^Any creature that observed the [a-z ]+, including you, can attempt checks to investigate the event to discover new clues and information\.$/;
const RULES = /@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|Strike|attack)\b/i;

/** {sceneCost, claimed} or null. */
export function compileSceneCost(adapted) {
    if ((adapted.damageComponents ?? []).length || adapted.defense?.kind === "save" || String(adapted.targeting?.target ?? "").trim()) return null;
    const seconds = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
    if (!seconds || paragraphs.length !== 2 || String(adapted.descriptionHTML).includes("<hr")) return null;
    const split = html => htmlToPlainText(`<p>${html}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const narration = split(paragraphs[0]), rules = split(paragraphs[1]);
    const cost = COST.exec(rules[0] ?? "");
    if (!cost || rules.length !== 2 || !OBSERVE.test(rules[1]) || narration.some(sentence => RULES.test(sentence))) return null;
    return { sceneCost: { seconds: Number(seconds[1]) * 60, dice: Number(cost[1]), faces: Number(cost[2]), type: cost[3], per: cost[4], typically: cost[5],
        notes: [...narration, rules[1]] }, claimed: [...narration, ...rules] };
}
