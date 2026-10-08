// A patron's power unleashed (Unleash True Power): "When you Cast this spell, you may immediately cast another spell with a cast time of 2 actions or less as a single
// action as your patrons cast directly through you. When you do so, you take 1d6 spirit damage per rank of the spell as fate itself pulls at your life (basic
// Fortitude). Spells you cast while this hex is active are heightened by one spell rank, up to a maximum of 10th-rank. The first time you Sustain the spell each turn,
// you can Cast another spell of 2 actions or less as a single action, suffering the damage each time you Cast a Spell this way. When this spell ends, you and all
// creatures in a 10-foot emanation take 10d6 spirit damage as a final shock of power surges through you with a basic Fortitude save.": the caster's Effect for the
// sustained duration shaping every other spell it casts one rank higher (to 10th); its card's control for a spell cast through the patron — the caster's basic save
// against its own spell DC and 1d6 spirit a rank of that spell; its end the 10d6 spirit save card for the caster and every creature within 10 feet.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const TEXT = [/^When you Cast this spell, you may immediately cast another spell with a cast time of (\d) actions or less as a single action as your patrons cast directly through you\.$/,
    /^When you do so, you take @Damage\[1d(\d+)\[([a-z]+)\]\] damage per rank of the spell as fate itself pulls at your life \(basic (Fortitude|Reflex|Will)\)\.$/,
    /^Spells you cast while this hex is active are heightened by (one|two) spell ranks?, up to a maximum of (\d+)(?:st|nd|rd|th)-rank\.$/,
    /^The first time you Sustain the spell each turn, you can Cast another spell of (\d) actions or less as a single action, suffering the damage each time you Cast a Spell this way\.$/,
    /^When this spell ends, you and all creatures in a (\d+)-foot emanation take (\d+d\d+) ([a-z]+) damage as a final shock of power surges through you with a basic (Fortitude|Reflex|Will) save\.$/];

/** {power, endHTML, sentences} or null. */
export function extractTruePower(item) {
    const save = item?.system?.defense?.save;
    if (!save?.basic || !item.system?.duration?.sustained || !/^1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || item.system?.area) return null;
    const sentences = htmlToPlainText(String(/<p>([\s\S]*?)<\/p>/.exec(item.system?.description?.value ?? "")?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/);
    if (sentences.length !== TEXT.length + 1 || NARRATION_RULES.test(sentences[0])) return null;
    const found = TEXT.map((pattern, index) => pattern.exec(sentences[index + 1]));
    if (found.some(match => !match) || found[0][1] !== found[3][1]) return null;
    const end = found[4], components = Object.values(item.system?.damage ?? {});
    if (end[4].toLowerCase() !== save.statistic || components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== end[2] || components[0].type !== end[3]) return null;
    return {
        power: { maxActions: Number(found[0][1]), patron: { die: Number(found[1][1]), type: found[1][2], statistic: found[1][3].toLowerCase() }, heighten: { by: { one: 1, two: 2 }[found[2][1]], cap: Number(found[2][2]) },
            end: { radius: Number(end[1]), formula: end[2], type: end[3], statistic: end[4].toLowerCase(), includesCaster: true }, seconds: 60 },
        endHTML: `<p>Each creature in the area takes ${end[2]} ${end[3]} damage with a basic ${end[4]} save.</p>`,
        sentences: sentences.slice(1)
    };
}
