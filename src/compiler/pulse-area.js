// A sustained area that deals its damage again on each Sustain, with no save (Wizards+'s Shadow Puppetry): "When you Cast the Spell, choose between acid, bludgeoning,
// cold, electricity, fire, force, piercing, slashing, sonic, or spirit damage. You create small shadows of creatures, objects, or figments that deal 1d6 damage of
// the type you chose to each creature in the area, and the first time you Sustain each turn." with "Heightened (+1) The damage increases by 1d6.": the placed
// burst, its damage (the item's dice at the cast rank, of the caster's type) to each creature in it when cast and on the first Sustain each turn. (The module's
// variants add a Will or Reflex save the text doesn't have; the text has none.)
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES, HEIGHTENED_DAMAGE_STEP_ONE as STEP } from "./text-patterns.js";

const CHOOSE = /^When you Cast the Spell, choose between ([a-z, ]+), or ([a-z]+) damage\.$/;
const DEALS = /^You create [a-z ,]+ that deal (\d+)d(\d+) damage of the type you chose to each creature in the area, and the first time you Sustain each turn\.$/;

/** {pulse, sentences} or null. */
export function extractPulseArea(adapted) {
    const area = adapted.targeting?.area;
    if (!area || adapted.defense?.kind === "save" || adapted.lifecycle?.sustained !== true || !/^1 minute$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const choose = CHOOSE.exec(sentences[1] ?? ""), deals = DEALS.exec(sentences[2] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !choose || !deals || !step) return null;
    const components = adapted.damageComponents ?? [], heightening = adapted.heightening ?? {};
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `${deals[1]}d${deals[2]}` || components[0].type !== "untyped"
        || heightening.type !== "interval" || heightening.interval !== 1 || String(heightening.damage?.[components[0].id]) !== `${step[1]}d${step[2]}` || step[2] !== deals[2]) return null;
    const types = [...choose[1].split(",").map(type => type.trim()).filter(Boolean), choose[2]];
    const rank = Number(adapted.rank) || 1;
    return {
        pulse: { area: { type: area.type, value: Number(area.value) }, types, formula: `(${deals[1]}+(@item.rank - ${rank})*${step[1]})d${deals[2]}`, seconds: 60, sustained: true, sourceText: sentences[2] },
        sentences: sentences.slice(1).concat(htmlToPlainText(heightened).trim())
    };
}
