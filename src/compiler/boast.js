// A boast that Demoralizes every enemy around the caster and turns the fear into a penalty to one named statistic (Belittling Boast): "… Select one of the
// following to boast about: melee attack rolls, ranged attack rolls, spell attack rolls, or a single skill. Attempt an @UUID[…]{Intimidation} check to
// @UUID[…]{Demoralize} all enemies within 30 feet. Each creature that becomes @UUID[…]{Frightened} additionally takes a -1 circumstance penalty to the attack roll
// or skill you boasted about for 1 minute. If at least one creature becomes frightened, you gain a +1 status penalty to the attack roll or skill you boasted
// about for 1 minute." and "Heightened (8th) The bonus and penalty increase to 2." — the caster's choice; PF2e's Intimidation check against each enemy's Will DC
// (Demoralize: Frightened 1, or 2 on a critical success); the frightened enemies' penalty Effect and, if any, the caster's bonus Effect (the Heightened entry
// calls the caster's "+1 status penalty" a bonus).
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    select: /^Select one of the following to boast about: melee attack rolls, ranged attack rolls, spell attack rolls, or a single skill\.$/,
    check: /^Attempt an @UUID\[[^\]]+\]\{Intimidation\} check to @UUID\[[^\]]+\]\{Demoralize\} all enemies within (\d+) feet\.$/,
    penalty: /^Each creature that becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Frightened\} additionally takes a -(\d) (circumstance|status) penalty to the attack roll or skill you boasted about for (\d+) minutes?\.$/,
    bonus: /^If at least one creature becomes frightened, you gain a \+(\d) (circumstance|status) (?:bonus|penalty) to the attack roll or skill you boasted about for (\d+) minutes?\.$/
};
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) The bonus and penalty increase to (\d+)\.$/;

/** {boast, claimed} or null. */
export function compileBoast(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {};
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const stepText = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (stepText && !step) return null;
    const { check, penalty, bonus } = claimed;
    if (penalty[3] !== bonus[3]) return null;
    return { boast: { radius: Number(check[1]), seconds: Number(penalty[3]) * 60, penalty: { value: Number(penalty[1]), type: penalty[2] }, bonus: { value: Number(bonus[1]), type: bonus[2] },
            step: step ? { rank: Number(step[1]), value: Number(step[2]) } : null, choices: ["melee", "ranged", "spell", "skill"] },
        claimed: [...sentences, ...(step ? [stepText] : [])] };
}

/** The penalty's and bonus's value at a cast rank. */
export function boastValue(data, which, castRank) {
    return data.step && Number(castRank) >= data.step.rank ? data.step.value : data[which].value;
}

/** The FlatModifier's selector and predicate for a boasted statistic (melee, ranged, spell or a skill's slug). */
export function boastSelector(choice) {
    if (choice === "melee") return { selector: "strike-attack-roll", predicate: ["item:melee"] };
    if (choice === "ranged") return { selector: "strike-attack-roll", predicate: ["item:ranged"] };
    if (choice === "spell") return { selector: "spell-attack-roll", predicate: [] };
    return { selector: choice, predicate: [] };
}
