// A skill check to counteract an effect giving one of listed conditions (Symphony of the Unfettered Heart): "Attempt a Performance check to counteract an effect
// applying one of the following conditions to the target: {Grabbed}, {Immobilized}, {Paralyzed}, {Restrained}, {Slowed}, or {Stunned}. If you fail, you can't target
// the same effect on the target for 1 day. Use the condition's source to determine the counteract DC (for example, the {Escape} DC for grabbed)." with "Heightened
// (9th) You can target up to four creatures." — for each target, the caster's check against the source's DC (the GM's, with the effect's counteract rank), PF2e's
// counteract rule at the cast rank; a success removes the condition (and the Effects granting it); a failure locks that condition on that target for the stated time.
import { htmlToPlainText } from "./description-parser.js";

const CHECK = /^Attempt an? ([A-Z][a-z]+) check to counteract an effect applying one of the following conditions to the target: (.+)\.$/;
const FAIL = /^If you fail, you can't target the same effect on the target for (\d+) (day|hour|minute)s?\.$/;
const DC = /^Use the condition's source to determine the counteract DC \(for example, the (?:@UUID\[[^\]]+\]\{)?Escape\}? DC for grabbed\)\.$/;
const STEP = /^Heightened \((\d+)(?:st|nd|rd|th)\) You can target up to (two|three|four|five) creatures\.$/;
const WORDS = { two: 2, three: 3, four: 4, five: 5 };
const SECONDS = { day: 86400, hour: 3600, minute: 60 };

/** {skillCounteract, claimed} or null. */
export function compileSkillCounteract(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^you or 1 ally$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z])/).filter(Boolean);
    let check = null, fail = null, dc = false;
    for (const [index, sentence] of sentences.entries()) {
        if (!check && CHECK.test(sentence)) { check = CHECK.exec(sentence); continue; }
        if (!fail && FAIL.test(sentence)) { fail = FAIL.exec(sentence); continue; }
        if (!dc && DC.test(sentence)) { dc = true; continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentence)) continue;
        return null;
    }
    const conditions = check ? [...check[2].matchAll(/@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)\}/g)].map(match => ({ uuid: match[1], name: match[2], slug: match[2].toLowerCase() })) : [];
    // (Every listed condition a link: the list is only those.)
    if (!check || !fail || !dc || conditions.length < 2 || check[2].replace(/@UUID\[[^\]]+\]\{[A-Z][a-z]+\}/g, "").replace(/,|\bor\b|\s/g, "")) return null;
    const stepText = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (stepText && !step) return null;
    return { skillCounteract: { skill: check[1].toLowerCase(), conditions, lockSeconds: Number(fail[1]) * SECONDS[fail[2]], targets: step ? { rank: Number(step[1]), count: WORDS[step[2]] } : null },
        claimed: [...sentences, ...(step ? [stepText] : [])] };
}
