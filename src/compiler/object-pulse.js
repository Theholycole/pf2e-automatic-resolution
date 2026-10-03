// A sustained target object that damages the creatures in its space and the adjacent spaces when cast and on each Sustain (Metal
// Reverberation):
//   "Whenever you Cast this Spell and the first time you sustain it on subsequent turns, the target object produces the same note in an
//   ear-piercing frequency that deals 1d12 sonic damage to all creatures in its space and all adjacent spaces (basic Fortitude save)."
// Rewritten to the lingering basic-save area "When you Cast the Spell and the first time you Sustain it each round, each creature in the
// area takes …": a 5-foot emanation the caster places on the object (its space and the adjacent spaces).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|can't|must|each|until)\b/i;
const PULSE = /^Whenever you Cast this Spell and the first time you sustain it on subsequent turns, the target object [a-z ,'-]{5,100} that deals (\d+)d(\d+) ([a-z]+) damage to all creatures in its space and all adjacent spaces \(basic (Fortitude|Reflex|Will) save\)\.$/;

/** {html, note, sentences} or null. */
export function extractObjectPulse(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained !== true
        || !/^(?:1|one) [a-z]+ object$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => PULSE.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 1 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
    const pulse = PULSE.exec(sentences[at]);
    if (`${pulse[1]}d${pulse[2]}` !== String(components[0].formula).replace(/\s+/g, "") || pulse[3] !== String(components[0].type).toLowerCase()
        || pulse[4].toLowerCase() !== adapted.defense.statistic) return null;
    if (rest.length) {
        const step = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+d\d+)\.\s*<\/p>$/.exec(rest[0]);
        if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === step[2])) return null;
    }
    return {
        html: `<p>When you Cast the Spell and the first time you Sustain it each round, each creature in the area takes ${pulse[1]}d${pulse[2]} ${pulse[3]} damage (basic ${pulse[4]} save).</p>`
            + (rest.length ? `<hr />${rest[0]}` : ""),
        note: "Place the area on the target object: its space and every adjacent space.",
        sentences: sentences.slice(at)
    };
}
