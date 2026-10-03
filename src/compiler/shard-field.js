// Shards that cut whoever moves through them (Etheric Shards): "You reach out and sow glittering splinters of force throughout the area, otherworldly
// caltrops of will and ectoplasm. The area is difficult terrain, even to flying or incorporeal creatures. Any creature that moves through the area takes 1d4
// piercing damage per square traversed, with a basic Reflex save made at the end of each move action they take through the area." with "Heightened (+2) The
// spell's area increases by 5 feet, and the piercing damage increases by 1.": a placed burst of difficult terrain (on the ground and in the air) for the
// spell's duration; the GM's control when a creature ends a move action through it — the squares it traversed — opens its basic save card of 1d4 (+1 every
// 2 ranks) per square; PF2e's area heightening widens it.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const TERRAIN = /^The area is difficult terrain, even to flying or incorporeal creatures\.$/;
const MOVES = /^Any creature that moves through the area takes 1d(\d+) ([a-z]+) damage per square traversed, with a basic (Fortitude|Reflex|Will) save made at the end of each move action they take through the area\.$/;
const STEP = /^Heightened \(\+(\d)\) The spell's area increases by (\d+) feet, and the ([a-z]+) damage increases by (\d+)\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteShardField(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const moves = MOVES.exec(sentences[2] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !TERRAIN.test(sentences[1]) || !moves || !step) return null;
    const [, die, type, statistic] = moves;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `1d${die}` || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || step[3] !== type
        || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1]) || String(adapted.heightening.damage?.[components[0].id] ?? "").trim() !== step[4]
        || Number(adapted.heightening.area ?? 0) !== Number(step[2])) return null;
    return {
        html: `<p>${sentences[0]} A creature takes 1d${die} ${type} damage with a basic ${statistic} save.</p>`,
        lingering: { events: [], initial: false, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "burst", value: Number(adapted.targeting.area.value) }, centre: "placed",
            durationSeconds: Number(minutes[1]) * 60, sustained: false, concealment: false, terrain: { difficulty: 2, movement: ["walk", "fly"], hazardous: false },
            moveSave: { componentId: components[0].id, die: Number(die), type, statistic: statistic.toLowerCase(), heightening: { interval: Number(step[1]), increase: Number(step[4]) },
                baseRank: Number(adapted.rank) || 1, sourceText: sentences[2] },
            notes: ["Incorporeal creatures are slowed by it too (difficult terrain)."], sourceText: [sentences[1], sentences[2]] },
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
