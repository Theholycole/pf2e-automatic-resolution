// A spotlight that draws every eye (Shine Spotlight): "You shine a spotlight of magical nature in the area and the area must include at least one creature. Non-allied
// creatures within 15 feet of the burst must make a Will Save or become Fascinated with the subjects of the spotlight and Off-Guard while fascinated. If a hostile action
// would end the fascination, the off-guard condition remains until the hostile action is resolved. Creatures inside the spotlight are not subject to this effect." /
// "While a creature is in the spotlight, it has a +1 status bonus to checks to Perform and a –1 circumstance penalty to Stealth checks. Creatures inside the spotlight can
// spend a single action to Perform to Sustain the spell on your behalf, and if the creature's Perform result exceeds the Will DC of a creature outside the spotlight and
// within 15 feet of the burst, the creature becomes fascinated with the performer and off-guard for as long as it is fascinated.": the placed burst a region for the
// sustained minute whose creatures hold the Perform bonus and Stealth penalty (from the text — the module's Effect gives a status Stealth penalty); each non-allied
// creature outside it and within 15 feet saves, a failure Fascinated and Off-Guard while fascinated, for as long as the spell lasts; the card's control for a creature
// inside Performing — its Performance against each such creature's Will DC.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const LEAD = [/^You shine a spotlight of magical nature in the area and the area must include at least one creature\.$/,
    /^Non-allied creatures within (\d+) feet of the burst must make a (Fortitude|Reflex|Will) Save or become @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{Fascinated\} with the subjects of the spotlight and @UUID\[(Compendium\.pf2e\.conditionitems\.(?:Item\.)?[A-Za-z0-9]+)\]\{Off-Guard\} while fascinated\.$/,
    /^(If a hostile action would end the fascination, the off-guard condition remains until the hostile action is resolved\.)$/, /^Creatures inside the spotlight are not subject to this effect\.$/];
const INSIDE = [/^While a creature is in the spotlight, it has a \+(\d) status bonus to checks to Perform and a [–-](\d) circumstance penalty to Stealth checks\.$/,
    /^Creatures inside the spotlight can spend a single action to Perform to Sustain the spell on your behalf, and if the creature['’]s Perform result exceeds the Will DC of a creature outside the spotlight and within (\d+) feet of the burst, the creature becomes fascinated with the performer and off-guard for as long as it is fascinated\.$/];

/** {spotlight, sentences} or null. */
export function extractSpotlight(item) {
    const area = item?.system?.area;
    if (area?.type !== "burst" || !/^sustained up to 1 minute$/.test(String(item.system?.duration?.value ?? "").trim()) || !item.system?.defense?.save?.statistic) return null;
    const paragraphs = [...String(item.system?.description?.value ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/), inside = htmlToPlainText(paragraphs[1] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const save = LEAD[1].exec(lead[2] ?? ""), note = LEAD[2].exec(lead[3] ?? ""), bonus = INSIDE[0].exec(inside[0] ?? ""), perform = INSIDE[1].exec(inside[1] ?? "");
    if (paragraphs.length !== 3 || lead.length !== 5 || NARRATION_RULES.test(htmlToPlainText(lead[0])) || !LEAD[0].test(lead[1]) || !save || !note || !LEAD[3].test(lead[4]) || inside.length !== 2 || !bonus || !perform
        || save[2].toLowerCase() !== item.system.defense.save.statistic || save[1] !== perform[1] || !/^@UUID\[[^\]]+\]\{[^}]+\}$/.test(paragraphs[2])) return null;
    const uuid = value => value.includes(".Item.") ? value : value.replace("conditionitems.", "conditionitems.Item.");
    return {
        spotlight: { radius: Number(area.value), reach: Number(save[1]), statistic: save[2].toLowerCase(), fascinated: uuid(save[3]), offGuard: uuid(save[4]), seconds: 60,
            rules: [{ key: "FlatModifier", selector: "performance", type: "status", value: Number(bonus[1]), predicate: ["action:perform"] }, { key: "FlatModifier", selector: "stealth", type: "circumstance", value: -Number(bonus[2]) }],
            notes: [note[1], "A creature in the spotlight can spend a single action to Perform to Sustain the spell on your behalf."] },
        sentences: [lead[1], htmlToPlainText(lead[2]), htmlToPlainText(lead[3]), lead[4], ...inside]
    };
}
