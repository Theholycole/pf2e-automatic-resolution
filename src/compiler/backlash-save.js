// A deadly line that turns back on the caster when it kills no one (Massacre): "Each living creature of 17th level or lower in the line must attempt a Fortitude
// save. If the damage from massacre reduces a creature to 0 Hit Points, that creature dies instantly. If massacre doesn't kill even a single creature, the void
// energy hungrily turns backward toward you, dealing an additional @Damage[30[void]] damage to every living creature in the line (even those above 17th level)
// and 30 void damage to you." with "Success The creature takes 9d6 void damage." (the item's damage) and "Heightened (10th) The spell can affect living creatures
// up to 19th level. Increase the damage to 10d6 on a success, and to 115 on a failure." — the save for living creatures up to the level (19th from 10th rank);
// death at 0 Hit Points (the compiler's post-damage death); the success row the item's damage (PF2e's heightening gives 10d6); and, once the card is finalized
// with no creature killed, the backlash: the stated damage to every living creature on the card, the level-excluded ones too, and to the caster.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const WHO = /^Each living creature of (\d+)(?:st|nd|rd|th) level or lower in the (line|cone|burst|emanation) must attempt an? (Fortitude|Reflex|Will) save\.$/;
const KILLS = /^If the damage from [a-z' ]+ reduces a creature to 0 Hit Points, that creature dies instantly\.$/;
const BACKLASH = /^If [a-z' ]+ doesn't kill even a single creature, the [a-z ]+ turns backward toward you, dealing an additional @Damage\[(\d+)\[([a-z]+)\]\] damage to every living creature in the (?:line|cone|burst|emanation) \(even those above (\d+)(?:st|nd|rd|th) level\) and (\d+) ([a-z]+) damage to you\.$/;
const SUCCESS = /^The creature takes (\d+d\d+) ([a-z]+) damage\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The spell can affect living creatures up to (\d+)(?:st|nd|rd|th) level\. Increase the damage to (\d+d\d+) on a success, and to (\d+) on a failure\.$/;

/** {html, levelLimit, backlash, sentences} or null. */
export function rewriteBacklashSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area) return null;
    const [lead, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const leadSentences = htmlToPlainText(lead.replace(/<\/?em>/g, "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    const rawLead = lead.replace(/<\/?em>/g, "").replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    if (leadSentences.length !== 4 || NARRATION_RULES.test(leadSentences[0])) return null;
    const who = WHO.exec(leadSentences[1]), backlash = BACKLASH.exec(rawLead[3]);
    if (!who || !KILLS.test(leadSentences[2]) || !backlash || who[2] !== adapted.targeting.area.type || who[3].toLowerCase() !== adapted.defense.statistic || backlash[3] !== who[1]) return null;
    const rows = [...table.matchAll(/<p>\s*<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => [match[1], match[2].replace(/\s+/g, " ").trim()]);
    const success = rows.find(([heading]) => heading === "Success");
    const taken = success ? SUCCESS.exec(htmlToPlainText(success[1]).trim()) : null;
    const components = adapted.damageComponents ?? [];
    if (rows.length !== 4 || !taken || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== taken[1] || String(components[0].type).toLowerCase() !== taken[2]) return null;
    const plainStep = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = plainStep ? STEP.exec(plainStep) : null;
    if (plainStep && !step) return null;
    const html = `<p>${leadSentences[0]} Each creature in the ${who[2]} must attempt a ${who[3]} save. ${leadSentences[2]}</p><hr />`
        + rows.map(([heading, body]) => `<p><strong>${heading}</strong> ${heading === "Success" ? "The creature takes full damage." : body}</p>`).join("");
    return {
        html,
        levelLimit: { level: Number(who[1]), byRank: step ? { [step[1]]: Number(step[2]) } : {}, sourceText: leadSentences[1] },
        backlash: { formula: `${backlash[1]}[${backlash[2]}]`, caster: `${backlash[4]}[${backlash[5]}]`, when: "none-killed", livingOnly: true, sourceText: htmlToPlainText(rawLead[3]).trim() },
        sentences: [...leadSentences, ...rows.map(([heading, body]) => `${heading} ${htmlToPlainText(body).trim()}`), ...(plainStep ? [plainStep] : [])]
    };
}
