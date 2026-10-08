// A teleport and a weapon Strike with extra force damage by its result (Blink Charge): "You teleport to an empty space adjacent to a creature you can see within
// range, then make a Strike against the creature with a weapon you're wielding. The Strike deals damage, plus an additional 2d8 force damage, depending on the result
// of your Strike." with "Critical Success Double damage, plus after the Strike, you can teleport the target into an empty space up to 5 feet away …", "Success The
// Strike deals full damage.", "Failure The Strike deals no damage, but the target takes 1d8 force damage.", "Critical Failure The Strike deals no damage, and you
// take 1d8 force damage." and "Heightened (+2) The spell's range increases by 60 feet, and any force damage the spell deals is increased by 1d8." — the caster's
// token moved beside the target; PF2e's Effect (its extra dice on the chosen weapon proved at the rank) for the Strike, PF2e's attack and damage; a failure's force
// damage to the target, a critical failure's to the caster; the critical success's teleport of the target the GM's.
import { htmlToPlainText } from "./description-parser.js";
import { LABELS, SPELL_EFFECT_LINK as LINK } from "./text-patterns.js";

const LEAD = [/^You teleport to an empty space adjacent to a creature you can see within range, then make a Strike against the creature with a weapon you're wielding\.$/,
    /^The Strike deals damage, plus an additional (\d+)d(\d+) ([a-z]+) damage, depending on the result of your Strike\.$/];
const ROWS = {
    criticalSuccess: /^Double damage, plus after the Strike, you can teleport the target into an empty space up to (\d+) feet away from its current position\. The new space must be on the ground if it started on the ground, in the air if it was flying, and so on\.$/,
    success: /^The Strike deals full damage\.$/,
    failure: /^The Strike deals no damage, but the target takes (\d+)d(\d+) ([a-z]+) damage\.$/,
    criticalFailure: /^The Strike deals no damage, and you take (\d+)d(\d+) ([a-z]+) damage\.$/
};
const STEP = /^Heightened \(\+(\d)\) The spell's range increases by (\d+) feet, and any ([a-z]+) damage the spell deals is increased by (\d+)d(\d+)\.$/;

/** {blinkStrike, claimed} or null; the catalog proves PF2e's Effect. */
export function compileBlinkStrike(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = paragraphs.map(paragraph => LINK.exec(paragraph)).find(Boolean);
    if (!range || !link) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const lead = split(paragraphs[0]);
    if (lead.length !== 3 || /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(lead[0]) || !LEAD[0].test(lead[1]) || !LEAD[1].test(lead[2])) return null;
    const extra = LEAD[1].exec(lead[2]);
    const rows = {};
    for (const paragraph of paragraphs) {
        const row = /^<strong>(Critical Success|Success|Failure|Critical Failure)<\/strong>\s*([\s\S]*)$/.exec(paragraph);
        if (!row) continue;
        const key = LABELS[row[1]], text = htmlToPlainText(row[2]).replace(/\s+/g, " ").trim();
        if (rows[key] || !ROWS[key].test(text)) return null;
        rows[key] = ROWS[key].exec(text);
    }
    const stepText = htmlToPlainText(paragraphs.find(paragraph => /^<strong>Heightened/.test(paragraph)) ?? "").replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (Object.keys(rows).length !== 4 || !step || step[3] !== extra[3] || rows.failure[3] !== extra[3] || rows.criticalFailure[3] !== extra[3] || step[5] !== extra[2]) return null;
    // PF2e's Effect: the chosen weapon (a ChoiceSet of equipped weapons) and its extra dice, the text's number at the spell's rank and each step.
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2]);
    const rules = effect?.mechanics?.rules ?? [];
    const choice = rules.findIndex(rule => rule.key === "ChoiceSet" && rule.flag === "weapon");
    const dice = rules.find(rule => rule.key === "DamageDice");
    const rank = Number(adapted.rank), interval = Number(step[1]);
    // ("ceil((@item.level - 2)/2)": 2 at 5th, 3 at 7th — the text's dice and its step.)
    const formula = /^ceil\(\(@item\.level-(\d+)\)\/(\d+)\)$/.exec(String(dice?.diceNumber ?? "").replace(/\s+/g, ""));
    const at = level => Math.ceil((level - Number(formula[1])) / Number(formula[2]));
    if (!effect?.id || choice < 0 || dice?.damageType !== extra[3] || dice.dieSize !== `d${extra[2]}` || !formula || Number(formula[2]) !== interval
        || at(rank) !== Number(extra[1]) || at(rank + interval) !== Number(extra[1]) + Number(step[4])) return null;
    return { blinkStrike: { range: Number(range[1]), rangeStep: Number(step[2]), interval, effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, choice,
            failure: { dice: Number(rows.failure[1]), faces: Number(rows.failure[2]), type: rows.failure[3] }, criticalFailure: { dice: Number(rows.criticalFailure[1]), faces: Number(rows.criticalFailure[2]), type: rows.criticalFailure[3] },
            stepDice: Number(step[4]), push: Number(rows.criticalSuccess[1]) },
        claimed: [...lead, ...Object.values(rows).map(row => row[0]), stepText, link[0]] };
}

/** The range and the rows' force dice at a cast rank. */
export function blinkStrikeAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.interval));
    return { range: data.range + steps * data.rangeStep, failure: `${data.failure.dice + steps * data.stepDice}d${data.failure.faces}`, criticalFailure: `${data.criticalFailure.dice + steps * data.stepDice}d${data.criticalFailure.faces}` };
}
