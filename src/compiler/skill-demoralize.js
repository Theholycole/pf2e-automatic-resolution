// PF2e's Effect for a target's fiery Strikes plus Demoralize with another skill (Flame Dancer): "Fire encircles the target's hands and feet … The target's unarmed
// Strikes deal an additional 2d6 fire damage. Critical hits with these Strikes also deal 2d4 persistent fire damage. Additionally, when the target attempts to
// {Demoralize} a foe, they can use Performance instead of Intimidation; when using Performance to Demoralize, the action loses the auditory trait but gains the
// visual trait, and the target doesn't take a penalty when attempting to Demoralize a creature that doesn't understand its language." with "Heightened (7th) The
// fire damage increases to 3d6, and the persistent fire damage increases to 3d4. If the target gets a critical success on a Demoralize check using Performance,
// the target of the Demoralize check becomes {Fleeing} from the target of flame dancer for 1 round." — PF2e's Effect (its dice proved against the text at both
// ranks); the card's control for the target's Demoralize with the skill: its check against the foe's Will DC (Frightened 1, 2 on a critical success; at the
// heightened rank a critical success also Fleeing from it for 1 round).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.([^\]]+)\]\{(Spell Effect: [^}]+)\}$/;
const STRIKES = /^The target's unarmed Strikes deal an additional (\d+)d(\d+) ([a-z]+) damage\.$/;
const CRIT = /^Critical hits with these Strikes also deal (\d+)d(\d+) persistent ([a-z]+) damage\.$/;
const SKILL = /^Additionally, when the target attempts to @UUID\[[^\]]+\]\{Demoralize\} a foe, they can use ([A-Z][a-z]+) instead of Intimidation; when using \1 to Demoralize, the action loses the auditory trait but gains the visual trait, and the target doesn't take a penalty when attempting to Demoralize a creature that doesn't understand its language\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The ([a-z]+) damage increases to (\d+)d(\d+), and the persistent ([a-z]+) damage increases to (\d+)d(\d+)\.$/;
const FLEE = new RegExp(String.raw`^If the target gets a critical success on a Demoralize check using ([A-Z][a-z]+), the target of the Demoralize check becomes ${C}Fleeing\} from the target of <em>[a-z ]+<\/em> for (\d+) rounds?\.$`);

/** {skillDemoralize, claimed} or null; the catalog proves PF2e's Effect. */
export function compileSkillDemoralize(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const paragraphs = [...`${body}${heightened}`.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    const lead = paragraphs[0]?.split(/(?<=[.!?])\s+(?=[A-Z@])/) ?? [];
    const highText = paragraphs.find(paragraph => /^<strong>Heightened/.test(paragraph)) ?? "";
    const high = htmlToPlainText(highText).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
    const highRaw = highText.replace(/^<strong>[^<]+<\/strong>\s*/, "").split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (!link || paragraphs.length !== 3 || lead.length !== 4 || high.length !== 2 || highRaw.length !== 2) return null;
    if (/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(htmlToPlainText(lead[0]))) return null;
    const strikes = STRIKES.exec(lead[1]), crit = CRIT.exec(lead[2]), skill = SKILL.exec(lead[3]), step = STEP.exec(high[0]), flee = FLEE.exec(highRaw[1]);
    if (!strikes || !crit || !skill || !step || !flee || flee[1] !== skill[1] || strikes[3] !== crit[3] || step[2] !== strikes[3] || step[5] !== crit[3]
        || step[4] !== strikes[2] || step[7] !== crit[2]) return null;
    // PF2e's Effect: the extra dice on unarmed Strikes and the critical hits' persistent dice, each the text's number at the base rank and the heightened one.
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const number = (rule, base, raised) => String(rule?.diceNumber ?? "").replace(/\s+/g, "") === `ternary(gte(@item.level,${step[1]}),${raised},${base})`;
    const dice = rules.find(rule => rule.key === "DamageDice" && !rule.category), persistent = rules.find(rule => rule.key === "DamageDice" && rule.category === "persistent");
    if (!effect?.id || rules.length !== 2 || dice?.damageType !== strikes[3] || dice.dieSize !== `d${strikes[2]}` || !number(dice, strikes[1], step[3]) || JSON.stringify(dice.predicate) !== '["unarmed"]'
        || persistent?.damageType !== crit[3] || persistent.dieSize !== `d${crit[2]}` || persistent.critical !== true || !number(persistent, crit[1], step[6]) || JSON.stringify(persistent.predicate) !== '["unarmed"]') return null;
    return { skillDemoralize: { seconds: Number(minutes[1]) * 60, effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, skill: skill[1].toLowerCase(), range: 30,
            fleeing: { rank: Number(step[1]), uuid: flee[2], rounds: Number(flee[3]) } },
        claimed: [...lead.map(sentence => htmlToPlainText(sentence)), ...high, link[0]] };
}
