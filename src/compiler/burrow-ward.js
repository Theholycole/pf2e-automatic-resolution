// Earth around the caster that hinders burrowers (Burrow Ward; user decision 2026-10-01: terrain for only some creatures is the module's region):
//   "Creatures that can't burrow through stone can't burrow through the area." / "Such creatures already underground within the area must succeed
//   at a Fortitude save or be ejected from the area toward the surface." / "Those who succeed are forced out of the area but can remain
//   underground." / "Creatures that can burrow through stone treat the area as difficult terrain." with "Heightened (5th) You create a 30-foot
//   emanation."
// A sustained region around the caster's token (following it): difficult terrain for burrowing for the creatures the GM marks as able to burrow
// through stone (no one else is hindered on the surface); that the others can't burrow through it is the GM's note. A card per creature the GM
// targets as underground in it rolls its Fortitude save: a failure is ejected toward the surface, a success forced out of the area (the GM moves
// them, as with the module's other forced movement).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const CANT = /^Creatures that can't burrow through stone can't burrow through the area\.$/;
const UNDER = /^Such creatures already underground within the area must succeed at an? (Fortitude|Reflex|Will) save or be ejected from the area toward the surface\.$/;
const SUCCEED = /^Those who succeed are forced out of the area but can remain underground\.$/;
const STONE = /^Creatures that can burrow through stone treat the area as difficult terrain\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*You create an? @Template\[emanation\|distance:(\d+)\]\.\s*<\/p>$/;

/** Returns {burrowWard, claimed} or null. */
export function compileBurrowWard(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => CANT.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const under = UNDER.exec(sentences[at + 1]), heightened = HEIGHTENED.exec(rest[0]);
    if (!under || !SUCCEED.test(sentences[at + 2]) || !STONE.test(sentences[at + 3]) || !heightened || under[1].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        burrowWard: { radius: [{ minRank: Number(adapted.rank), feet: Number(area.value) }, { minRank: Number(heightened[1]), feet: Number(heightened[2]) }],
            durationSeconds: Number(minutes[1]) * 60, statistic: adapted.defense.statistic, terrain: { action: "burrow", difficulty: 2 },
            outcomes: { failure: "ejected from the area toward the surface", success: "forced out of the area, but can remain underground" },
            notes: [sentences[at]] },
        claimed: [...sentences.slice(at), htmlToPlainText(rest[0]).trim()]
    };
}

/** The emanation's radius at a cast rank. */
export function burrowWardRadius(ward, castRank) {
    return (ward.radius.filter(step => Number(castRank) >= step.minRank).at(-1) ?? ward.radius[0]).feet;
}
