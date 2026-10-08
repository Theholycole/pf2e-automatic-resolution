// Creepers that trip, disarm and shove (Coiling Creepers): "When you Cast the Spell, and each time you Sustain the spell, the coiling creepers make an Athletics check to
// Disarm, Reposition, or Trip a creature in the area or an adjacent square using your spell attack roll modifier. The coiling creepers cannot leave the area and are
// treated as a Large creature for the purposes of determining what creatures it can make Athletics checks against. If you Sustain the spell multiple times in a round,
// you gain this effect each time. The coiling creepers use your multiple attack penalty. Squares filled with coiling creepers are difficult terrain. Each square can be
// cleared of coiling creepers by a single attack or effect that deals at least 10 slashing damage or 2 fire damage. A square has AC 5, and it automatically fails its
// saving throws. …" with "Heightened (+1) The slashing damage is increased by 5 and the fire damage is increased by 1.": the placed burst a region of difficult terrain
// for the sustained minute; the card's maneuver control — PF2e's Disarm, Reposition or Trip with the caster's spell attack modifier and multiple attack penalty
// against the creature's DC (Huge or smaller: a Large creature's reach), its results applied (Prone and the critical Trip's 1d6; the Disarm penalty; the Reposition's
// feet a note); the square a qualifying hit clears cut from the region; the squares' AC and saves a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES, named } from "./text-patterns.js";

const LEAD = [/^When you Cast the Spell, and each time you Sustain the spell, the ([a-z ]+) make an Athletics check to @UUID\[[^\]]+\]\{Disarm\}, @UUID\[[^\]]+\]\{Reposition\}, or @UUID\[[^\]]+\]\{Trip\} a creature in the area or an adjacent square using your spell attack roll modifier\.$/,
    /^The \1 cannot leave the area and are treated as a (Small|Medium|Large|Huge) creature for the purposes of determining what creatures it can make Athletics checks against\.$/,
    /^If you Sustain the spell multiple times in a round, you gain this effect each time\.$/, /^The \1 use your multiple attack penalty\.$/,
    /^Squares filled with \1 are difficult terrain\.$/,
    /^Each square can be cleared of \1 by a single attack or effect that deals at least @Damage\[\((\d+)\+\(@item\.rank -(\d+)\)\*(\d+)\)\[slashing\]\] damage or @Damage\[\((\d+)\+@item\.rank -(\d+)\)\[fire\]\] damage\.$/,
    /^(A square has AC (\d+), and it automatically fails its saving throws\.)$/, /^(The \1 don't grant flanking, or have any other attributes a creature would\.)$/,
    /^The \1 can't make any other attacks other than the specified Athletics maneuvers\.$/];
const STEP = /^Heightened \(\+1\) The slashing damage is increased by (\d+) and the fire damage is increased by (\d+)\.$/;

/** {creepers, sentences} or null. */
export function extractCreepers(item) {
    const area = item?.system?.area;
    if (area?.type !== "burst" || !item.system?.duration?.sustained || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || item.system?.defense) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = String(/<p>([\s\S]*?)<\/p>/.exec(body)?.[1] ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const first = LEAD[0].exec(sentences[1] ?? "");
    if (sentences.length !== LEAD.length + 1 || NARRATION_RULES.test(htmlToPlainText(sentences[0])) || !first) return null;
    const name = first[1], found = LEAD.map((pattern, index) => index ? named(pattern, name).exec(sentences[index + 1]) : first);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const clear = found[5], rank = Number(item.system?.level?.value ?? 1);
    if (found.some(match => !match) || !step || Number(clear[2]) !== rank || Number(clear[5]) !== rank || Number(clear[3]) !== Number(step[1]) || Number(step[2]) !== 1) return null;
    const sizes = ["tiny", "sm", "med", "lg", "huge", "grg"], size = { Small: "sm", Medium: "med", Large: "lg", Huge: "huge" }[found[1][1]];
    return {
        creepers: { name, radius: Number(area.value), seconds: 60, maxTarget: sizes[Math.min(sizes.indexOf(size) + 1, sizes.length - 1)], baseRank: rank,
            clear: { slashing: Number(clear[1]), slashingStep: Number(clear[3]), fire: Number(clear[4]), fireStep: Number(step[2]) },
            maneuvers: { disarm: "reflex", reposition: "fortitude", trip: "reflex" }, notes: [found[6][1], found[7][1].replace(/^The /, "The ")] },
        sentences: sentences.slice(1).map(sentence => htmlToPlainText(sentence)).concat(htmlToPlainText(heightened).trim())
    };
}

/** The damage that clears a square at a rank. */
export function creepersClearAt(creepers, rank) {
    const steps = Math.max(0, Number(rank) - creepers.baseRank);
    return { slashing: creepers.clear.slashing + steps * creepers.clear.slashingStep, fire: creepers.clear.fire + steps * creepers.clear.fireStep };
}
