// A swamp whose burst grows with the actions spent (Swamp of Sloth): "Ground in the area turns swampy and fetid." / "The area is difficult
// terrain." / … / "The swamp deals 1d6 poison damage to creatures that end their turn in the area (basic Fortitude save)." / "For each additional
// action you use when Casting the Spell, increase the burst's radius by 5 feet." with "Heightened (+2) The damage increases by 1d6, and the initial
// radius increases by 5 feet": a lingering burst (difficult terrain) whose turn-end save deals the damage; its radius 5 feet (the smallest burst:
// the text names no initial radius), 5 more for each action past the first and each heightening step.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const TERRAIN = /^The area is difficult terrain\.$/;
const DEALS = /^The swamp deals (\d+d\d+) ([a-z]+) damage to creatures that end their turn in the area \(basic (Fortitude|Reflex|Will) save\)\.$/;
const ACTIONS = /^For each additional action you use when Casting the Spell, increase the burst's radius by (\d+) feet\.$/;
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d+d\d+), and the initial radius increases by (\d+) feet\.?$/;

/** {html, area, actionStep, areaStep, sentences} or null. */
export function rewriteSlothSwamp(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.targeting?.target) return null;
    if (!/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => TERRAIN.test(sentence));
    if (sentences.length !== 6 || at !== 1 || NARRATION_RULES.test(sentences[0]) || [sentences[2], sentences[3]].some(sentence => NARRATION_RULES.test(sentence))) return null;
    const deals = DEALS.exec(sentences[4]), actions = ACTIONS.exec(sentences[5]), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!deals || !actions || !step) return null;
    const [, formula, type, statistic] = deals;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || step[3] !== actions[1]) return null;
    return {
        // (The sludge beasts are narration: "These don't function as normal creatures".)
        html: `<p>${sentences[0]} The area is difficult terrain. A creature that ends its turn in the area takes ${formula} ${type} damage with a basic ${statistic} save.</p>`
            + `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>`,
        area: { type: "burst", value: 5 },
        actionStep: { feet: Number(actions[1]), sourceText: sentences[5] },
        areaStep: { interval: Number(step[1]), feet: Number(step[3]), baseRank: Number(adapted.rank) || 1, sourceText: htmlToPlainText(heightened).trim() },
        sentences
    };
}
