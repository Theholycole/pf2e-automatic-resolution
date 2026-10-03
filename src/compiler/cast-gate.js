// A save that happens only in a situation the GM judges (Signal Skyrocket):
//   "If the rocket explodes in an enclosed space smaller than the full size of the burst, each creature in the area takes 1d10
//   sonic damage depending on the result of its Reflex save."
// The card asks the GM once whether it holds; "no" leaves every creature unaffected. Sentences that only restrict where the
// spell's projectile goes ("You can't change the direction or distance of the rocket …") are the GM's placement note.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const GATED_SAVE = /^If (the [a-z]+ (?:explodes|bursts|detonates|lands|strikes) [^,@]{5,150}), (each creature in the (?:area|burst|cone|emanation)) takes (\d+d\d+) ([a-z]+) damage depending on the result of its (Fortitude|Reflex|Will) save\.$/;
// A placement restriction on the spell's own projectile, with nothing else mechanical in it.
const PLACEMENT = /^You can't change the (?:direction|distance|path)(?: or (?:direction|distance|path))? of the [a-z]+\b[^@\d]*\.$/;
const PLACEMENT_BLOCKERS = /\b(?:damage|saves?|saving throws?|bonus|penalty|conditions?|immune|creatures?|targets?|allies|enemies|you take|you are)\b/i;

/** {castGate, placement, sentences} for a degree save's preamble, or null. */
export function compileCastGate(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML).split(/<hr\b/i, 1)[0]).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim());
    const gated = sentences.map(sentence => GATED_SAVE.exec(sentence)).filter(Boolean);
    if (gated.length !== 1) return null;
    const [sourceText, situation, , formula, type, statistic] = gated[0];
    if (components.length !== 1 || components[0].category || components[0].formula !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const placement = sentences.filter(sentence => PLACEMENT.test(sentence) && !PLACEMENT_BLOCKERS.test(sentence));
    return {
        castGate: { question: `Does this hold: ${situation}? If not, no creature is affected.`, sourceText },
        placement: placement.length ? { kind: "placement", text: `Placement: ${placement.join(" ")}`, sourceText: placement.join(" ") } : null,
        sentences: [sourceText, ...placement]
    };
}
