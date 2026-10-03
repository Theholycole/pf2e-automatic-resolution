// An illusory double of a creature that serves as the caster's minion (Replicate): "You create an illusory magical double that physically looks and behaves very
// similarly to the target. This double is limited to moving, Interacting, speaking short sentences, and other similar basic tasks. It is unable to cast spells,
// attack, or use any complex skills." / "The illusory duplicate is your minion. You can issue new commands to the double as part of Sustaining the Spell. … The
// illusory duplicate has the same statistics as the original creature, except it doesn't have any of the original's item bonuses, and it has one quarter of the
// original's Hit Points. If the double's Hit Points are reduced to 0, the spell ends." with "Heightened (+1) The maximum level of the target increases by 2." and
// Target "1 willing or unconscious creature of 8th level or lower" — the target (its level at most the rank's, willing or unconscious) copied as a token with
// a quarter of its Hit Points and the minion trait, owned like the caster, while the caster Sustains (10 minutes); at 0 HP the spell ends; the rest are notes.
import { htmlToPlainText } from "./description-parser.js";

const TARGET = /^1 willing or unconscious creature of (\d+)(?:st|nd|rd|th) level or lower$/i;
const LEAD = [/^You create an illusory magical double that physically looks and behaves very similarly to the target\.$/];
const NOTES = [/^This double is limited to moving, Interacting, speaking short sentences, and other similar basic tasks\.$/, /^It is unable to cast spells, attack, or use any complex skills\.$/,
    /^You can issue new commands to the double as part of Sustaining the Spell\.$/,
    /^You can command the duplicate telepathically as long as the spell lasts, provided it's within \d+ miles? of you\.$/,
    /^You can switch between using your own senses and the duplicate's senses with a single action, which has the concentrate trait\.$/];
const MINION = /^The illusory duplicate is your minion\.$/;
const STATS = /^The illusory duplicate has the same statistics as the original creature, except it doesn't have any of the original's item bonuses, and it has one (quarter|half|third) of the original's Hit Points\.$/;
const ZERO = /^If the double's Hit Points are reduced to 0, the spell ends\.$/;
const STEP = /^Heightened \(\+(\d)\) The maximum level of the target increases by (\d+)\.$/;
const FRACTION = { quarter: 0.25, third: 1 / 3, half: 0.5 };

/** {replica, claimed} or null. */
export function compileReplica(adapted) {
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target || (adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (rest.length || !LEAD[0].test(sentences[0] ?? "")) return null;
    let minion = false, stats = null, zero = false;
    const notes = [];
    for (const sentence of sentences.slice(1)) {
        if (MINION.test(sentence)) { minion = true; continue; }
        if (STATS.test(sentence)) { stats = STATS.exec(sentence); continue; }
        if (ZERO.test(sentence)) { zero = true; continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        return null;
    }
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!minion || !stats || !zero || notes.length !== NOTES.length || (heightened.trim() && !step)) return null;
    return { replica: { maxLevel: { base: Number(target[1]), step: step ? { interval: Number(step[1]), add: Number(step[2]) } : null }, hpFraction: FRACTION[stats[1]], seconds: 600,
            notes: [...notes, "The duplicate doesn't have the original's item bonuses (the GM removes them from its rolls)."] },
        claimed: [...sentences, ...(step ? [step[0]] : [])] };
}

/** The highest level the target may be at a cast rank. */
export function replicaMaxLevel(data, castRank, baseRank) {
    return data.maxLevel.base + (data.maxLevel.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.maxLevel.step.interval)) * data.maxLevel.step.add : 0);
}
