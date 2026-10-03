// A blast whose damage type and area the caster picks and whose save the target picks (Shadow Blast):
//   "Area varies" / "Defense @Check[reflex|basic|…] or @Check[will|basic|…] (target's choice)" / "You shape the shadow substance of the
//   Netherworld into a blast." / "Choose @Damage[(@item.rank+1)d8[acid]|…], …, or @Damage[(@item.rank+1)d8[spirit]|…] damage, and choose a
//   @Template[cone|distance:30], a @Template[burst|distance:15] within 120 feet, or a @Template[line|distance:50]." / "The blast deals 6d8
//   damage of the type you chose to each creature in the area." with "Heightened (+1) The damage increases by 1d8."
// Rewritten to the text-damage form (the caster picks the type on the card; the dice at the cast rank, checked against the inline rolls) and a
// basic save of the first statistic, with the target's choice between the two: each target rolls its better save (user-facing note). The area
// choice is the caster's placement (a note).
import { htmlToPlainText } from "./description-parser.js";

const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*varies\s*<\/p>\s*/;
const DEFENSE = /^<p>\s*<strong>\s*Defense\s*<\/strong>\s*@Check\[(fortitude|reflex|will)\|basic[^\]]*\] or @Check\[(fortitude|reflex|will)\|basic[^\]]*\] \(target's choice\)\s*<\/p>\s*<hr\s*\/?>\s*/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const INLINE = /^@Damage\[\(@item\.rank\+(\d+)\)d(\d+)\[([a-z]+)\](?:\|[^\]]*)?\]$/;
const TEMPLATE = /^an? @Template\[(?:type:)?(cone|burst|line|emanation)\|distance:(\d+)\](?: within (\d+) feet)?$/;
const DEALS = /^The [a-z]+ deals (\d+)d(\d+) damage of the type you chose to each creature in the area\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage increases by 1d(\d+)\.\s*<\/p>$/;

/** {html, defense, saveChoice, areas, claimed} or null. */
export function rewriteChoiceBlast(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    let html = String(adapted.descriptionHTML ?? "").trim();
    const area = AREA.exec(html);
    if (!area) return null;
    html = html.slice(area[0].length);
    const defense = DEFENSE.exec(html);
    if (!defense || defense[1] === defense[2]) return null;
    html = html.slice(defense[0].length);
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1 || !STEP.test(rest[0])) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => /^Choose /.test(sentence));
    if (at < 0 || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const choose = /^Choose (.+) damage, and choose (.+)\.$/.exec(sentences[at]);
    const deals = DEALS.exec(sentences[at + 1]);
    if (!choose || !deals) return null;
    const rolls = choose[1].replace(/,? or /, ", ").split(/, /).map(part => INLINE.exec(part.trim()));
    const areas = choose[2].replace(/,? or /, ", ").split(/, /).map(part => TEMPLATE.exec(part.trim()));
    if (rolls.length < 2 || rolls.some(roll => !roll) || areas.length < 2 || areas.some(entry => !entry)) return null;
    const dice = Number(deals[1]), die = Number(deals[2]), rank = Number(adapted.rank) || 1;
    // The inline rolls ((@item.rank+N)dX) must be the stated dice at the spell's rank, rising 1 a rank as the Heightened entry says.
    if (rolls.some(roll => Number(roll[2]) !== die || rank + Number(roll[1]) !== dice) || Number(STEP.exec(rest[0])[1]) !== die) return null;
    const types = rolls.map(roll => roll[3]);
    if (new Set(types).size !== types.length) return null;
    const [first, second] = [defense[1], defense[2]];
    return {
        html: `<p>You deal ${dice}d${die} damage of one type you choose (${types.join(", ")}) to all creatures in the area, with a basic ${first[0].toUpperCase()}${first.slice(1)} save.</p><hr />${rest[0]}`,
        defense: { kind: "save", statistic: first, basic: true },
        saveChoice: { statistics: [first, second], chooser: "target", sourceText: htmlToPlainText(defense[0]).replace(/\s+/g, " ").trim() },
        areas: areas.map(entry => ({ type: entry[1], value: Number(entry[2]), ...(entry[3] ? { within: Number(entry[3]) } : {}) })),
        claimed: sentences
    };
}
