// A target's basic save, then a spread of damage around it if it fails (Propagating Arc): "You create an arc of electricity that deals 2d12 electricity damage
// to the target. If the target fails its save, each creature within 10 feet of the target also takes @Damage[(@item.level)d6[electricity]] damage with a basic
// Reflex save, or half this amount if the creature was further than 10 feet but within 20 feet of the target. There must be at least 1 creature within 10
// feet of the target for you to deal damage to creatures other than the target." with "Heightened (+1) The damage to the target increases by 1d12 and the
// damage to targets within 10 feet of the target increases by 1d6.": the target's basic save (the item's damage); on a failure, a card for the creatures
// around it (not the target) — the text's (rank)d6 with the same basic save, halved for those beyond the inner distance — only when one is within it.
import { htmlToPlainText } from "./description-parser.js";
// (Its narration's "until the area around the target is filled" is flavour: the rule words without "until".)
import { NARRATION_RULES_NO_UNTIL as NARRATION_RULES } from "./text-patterns.js";

const DEALS = /^You create an arc of ([a-z]+) that deals (\d+d\d+) ([a-z]+) damage to the target\.$/;
const SPREAD = /^If the target fails its save, each creature within (\d+) feet of the target also takes @Damage\[\(@item\.level\)d(\d+)\[([a-z]+)\]\] damage with a basic (Fortitude|Reflex|Will) save, or half this amount if the creature was further than (\d+) feet but within (\d+) feet of the target\.$/;
const AT_LEAST = /^There must be at least 1 creature within (\d+) feet of the target for you to deal damage to creatures other than the target\.$/;
const STEP = /^Heightened \(\+1\) The damage to the target increases by (\d+d\d+) and the damage to targets within (\d+) feet of the target increases by (\d+d\d+)\.$/;

/** {mainHTML, spread: {radius, outer, die, type, statistic}, followDamage, sentences} or null. */
export function extractPropagatingArc(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    const deals = DEALS.exec(sentences[1] ?? ""), spread = SPREAD.exec(sentences[2] ?? ""), least = AT_LEAST.exec(sentences[3] ?? "");
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !deals || !spread || !least || !step) return null;
    const [, , formula, type] = deals, [, radius, die, spreadType, statistic, inner, outer] = spread;
    const components = adapted.damageComponents ?? [], heightening = adapted.heightening ?? {};
    // (The item's damage is the target's, heightened as the text says; the spread's dice are the text's, one die per rank.)
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || components[0].type !== type || deals[1] !== type
        || spreadType !== type || statistic.toLowerCase() !== adapted.defense.statistic || heightening.type !== "interval" || heightening.interval !== 1
        || String(heightening.damage?.[components[0].id]) !== step[1] || step[1].replace(/^\d+/, "") !== formula.replace(/^\d+/, "") || step[3] !== `1d${die}`
        || radius !== inner || radius !== least[1] || radius !== step[2] || Number(outer) <= Number(radius)) return null;
    const rank = Number(adapted.rank) || 1;
    return {
        mainHTML: `<p>The target takes ${formula} ${type} damage with a basic ${statistic} save.</p><hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>`,
        followHTML: `<p>Each creature takes ${rank}d${die} ${type} damage with a basic ${statistic} save.</p>`,
        followDamage: { formula: `${rank}d${die}`, type, step: `1d${die}` },
        spread: { radius: Number(radius), outer: Number(outer), statistic: statistic.toLowerCase() },
        sentences: sentences.slice(1).concat(htmlToPlainText(heightened).trim())
    };
}
