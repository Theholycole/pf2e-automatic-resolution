// A basic save when cast that leaves a sustained storm hurting creatures who end their turns in it (Ice Storm): "You create a gray storm
// cloud that pelts creatures with an icy deluge." / "When you Cast the Spell, a burst of magical hail deals 2d8 bludgeoning damage and 2d8
// cold damage to each creature in the area below the cloud (basic Reflex save)." / "Snow and sleet continue to rain down in the area for the
// remainder of the spell's duration, making the area difficult terrain." / "Any creature that ends its turn in the storm takes
// @Damage[(floor(@item.level/2))[cold]] damage." / "If you Cast this Spell outdoors, you can create two nonoverlapping clouds instead of
// one." / "As normal, if a Large or larger creature is in both clouds, it still only takes the initial damage once and the continuing damage
// once per turn." with "Heightened (+2) The initial bludgeoning damage and cold damage increase by 1d8 each, and the cold damage creatures
// take at the end of their turns increases by 1.": the save card's damage when cast; after Finalize the GM selects the area and the card
// places the storm (difficult terrain, the turn-end damage at the cast rank, no save, Sustained); the two clouds are notes.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const CAST = /^When you Cast the Spell, a burst of [a-z ]+ deals (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage to each creature in the area below the cloud \(basic (Fortitude|Reflex|Will) save\)\.$/;
const TERRAIN = /^[A-Z][a-z ]+ continue to [a-z ]+ in the area for the remainder of the spell's duration, making the area difficult terrain\.$/;
const TURN_END = /^Any creature that ends its turn in the storm takes @Damage\[\(floor\(@item\.(?:level|rank)\/2\)\)\[([a-z]+)\]\] damage\.$/;
const OUTDOORS = /^If you Cast this Spell outdoors, you can create two nonoverlapping clouds instead of one\.$/;
const BOTH = /^As normal, if a Large or larger creature is in both clouds, it still only takes the initial damage once and the continuing damage once per turn\.$/;
const STEP = /^Heightened \(\+2\) The initial ([a-z]+) damage and ([a-z]+) damage increase by 1d8 each, and the ([a-z]+) damage creatures take at the end of their turns increases by 1\.$/;

/** {areaTerrain, sentences} or null. The rest of the description (the save sentence) stays the basic save's. */
export function compileStormArea(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const duration = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim().replace(/^sustained up to /i, ""));
    if (!duration) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const body = htmlToPlainText(stripHeighteningHTML(html)).replace(/\s+/g, " ").trim();
    const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 6 || NARRATION_RULES.test(sentences[0])) return null;
    const cast = CAST.exec(sentences[1]), turn = TURN_END.exec(sentences[3]);
    if (!cast || !TERRAIN.test(sentences[2]) || !turn || !OUTDOORS.test(sentences[4]) || !BOTH.test(sentences[5])) return null;
    const components = adapted.damageComponents ?? [];
    const parts = [[cast[1], cast[2]], [cast[3], cast[4]]];
    if (components.length !== 2 || components.some(component => component.category)
        || !parts.every(([formula, type], index) => String(components[index].formula).replace(/\s+/g, "") === formula && String(components[index].type).toLowerCase() === type)
        || cast[5].toLowerCase() !== adapted.defense.statistic) return null;
    // (The text's heightening: the item's dice by 1d8 each, and the turn-end damage by 1 every 2 ranks — floor(rank/2) does that.)
    const heightened = /Heightened[\s\S]*$/.exec(htmlToPlainText(html).replace(/\s+/g, " "))?.[0]?.trim() ?? "";
    const step = STEP.exec(heightened);
    if (!step || step[1] !== cast[2] || step[2] !== cast[4] || step[3] !== turn[1]) return null;
    return {
        areaTerrain: { durationSeconds: Number(duration[1]) * 60, sourceText: sentences[2], sustained: true,
            hazard: { events: ["turn-end"], formula: "(floor(@item.rank/2))", type: turn[1], label: "the storm", sourceText: sentences[3] },
            notes: [sentences[4], sentences[5]] },
        sentences: [sentences[2], sentences[3], sentences[4], sentences[5]]
    };
}
