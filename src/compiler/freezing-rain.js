// A sustained rain whose Sustain may freeze it (Freezing Rain):
//   "Intense cold rain comes from nowhere, …" / "The driving rain and pooling water make the area difficult terrain and extinguish non-magical
//   fires." / "On subsequent rounds, the first time you Sustain the spell each round, you can move the area up to 20 feet and can also freeze the
//   rain." / "If you freeze the rain, each creature in the area takes 4d6 cold damage and might be slowed, depending on result of its Reflex save."
// The lingering area (difficult terrain) exposed on that Sustain only; whether the caster freezes the rain is the review (mark the creatures
// unaffected when it isn't frozen); moving the area and the fires are notes.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const TERRAIN = /^The [a-z ]+ make the area difficult terrain and extinguish non-magical fires\.$/;
const MOVE = /^On subsequent rounds, the first time you Sustain the spell each round, you can move the area up to (\d+) feet and can also freeze the ([a-z]+)\.$/;
const FREEZE = /^If you freeze the ([a-z]+), each creature in the area takes (\d+d\d+) ([a-z]+) damage and might be [a-z]+, depending on result of its (Fortitude|Reflex|Will) save\.$/;

/** {html, notes, claimed} or null. */
export function rewriteFreezingRain(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !TERRAIN.test(sentences[1])) return null;
    const move = MOVE.exec(sentences[2]), freeze = FREEZE.exec(sentences[3]);
    if (!move || !freeze || move[2] !== freeze[1] || freeze[4].toLowerCase() !== adapted.defense.statistic
        || String(components[0].formula).replace(/\s+/g, "") !== freeze[2] || String(components[0].type).toLowerCase() !== freeze[3]) return null;
    return {
        html: `<p>All surfaces in the area are difficult terrain. The first time you Sustain the spell each round, each creature in the area takes ${freeze[2]} ${freeze[3]} damage and must attempt a ${freeze[4]} save.</p><hr />${rest.join("<hr />")}`,
        notes: [`When you Sustain the spell, you can move the area up to ${move[1]} feet (move the region) and choose whether to freeze the ${move[2]}: if you don't, mark every creature unaffected in the review.`,
            "The rain extinguishes non-magical fires in the area (the GM's)."],
        claimed: sentences
    };
}
