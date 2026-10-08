// A foe offered a valiant end (Honorable Death): "Choose yourself or an ally within 30 feet and the target must attempt a Will save. A creature that is reduced to 0 Hit
// Points while this spell is active is instantly killed and their soul is transported to the domain of your deity …" with "Critical Success The target is unaffected
// and the spell ends." / "Success If the target does not take a hostile action against you or your chosen ally by the end of its turn, it takes spirit damage equal
// to twice this spell's rank with a basic Will save and then the spell ends." / "Failure As success, except the creature takes damage at the end of each of its turns
// for 4 rounds. At the end of each of its turns, it can attempt a new Will save to reduce the remaining duration by 1 round, or end it entirely on a critical
// success." / "Critical Failure As failure, except the duration is 1 minute.": the caster's champion (itself or an ally within the range); the target's save; its
// Effect for the row's time with the GM's end-of-turn control — no hostile action against the two: the damage (twice the rank, basic save); then, on the longer
// rows, the save that shortens or ends it; the target reduced to 0 Hit Points while it lasts dies (the module reads "a creature" as the spell's target).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = [/^Choose yourself or an ally within (\d+) feet and the target must attempt a (Fortitude|Reflex|Will) save\.$/,
    /^(A creature that is reduced to 0 Hit Points while this spell is active is instantly killed) and (their soul is transported to the domain of your deity to become a shade or appropriate entity there)\.$/];
const ROWS = { criticalSuccess: /^The target is unaffected and the spell ends\.$/,
    success: /^If the target does not take a hostile action against you or your chosen ally by the end of its turn, it takes ([a-z]+) damage equal to twice this spell['’]s rank with a basic (Fortitude|Reflex|Will) save and then the spell ends\.$/,
    failure: /^As success, except the creature takes damage at the end of each of its turns for (\d+) rounds\. At the end of each of its turns, it can attempt a new (Fortitude|Reflex|Will) save to reduce the remaining duration by 1 round, or end it entirely on a critical success\.$/,
    criticalFailure: /^As failure, except the duration is (\d+) minutes?\.$/ };

/** {duel, sentences} or null. */
export function extractHonorDuel(item) {
    const save = item?.system?.defense?.save;
    if (!save?.statistic || save.basic || !/^varies$/.test(String(item.system?.duration?.value ?? "").trim()) || !/^1 creature$/.test(String(item.system?.target?.value ?? "").trim())) return null;
    const [body, table = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const lead = htmlToPlainText(String(/<p>([\s\S]*?)<\/p>/.exec(body)?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const row = heading => htmlToPlainText(String(new RegExp(String.raw`<p><strong>${heading}\s*</strong>\s*([\s\S]*?)</p>`).exec(table)?.[1] ?? "")).replace(/\s+/g, " ").trim();
    const first = LEAD[0].exec(lead[1] ?? ""), death = LEAD[1].exec(lead[2] ?? "");
    const rows = Object.fromEntries(Object.entries(ROWS).map(([degree, pattern]) => [degree, pattern.exec(row({ criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" }[degree]))]));
    if (lead.length !== 3 || NARRATION_RULES.test(lead[0]) || !first || !death || Object.values(rows).some(entry => !entry) || first[2].toLowerCase() !== save.statistic) return null;
    const components = Object.values(item.system?.damage ?? {}), rank = Number(item.system?.level?.value ?? 1);
    if (components.length !== 1 || components[0].type !== rows.success[1] || Number(components[0].formula) !== 2 * rank) return null;
    return {
        duel: { range: Number(first[1]), statistic: save.statistic, damage: { type: rows.success[1], perRank: 2, statistic: rows.success[2].toLowerCase() }, recovery: rows.failure[2].toLowerCase(),
            seconds: { success: 6, failure: Number(rows.failure[1]) * 6, criticalFailure: Number(rows.criticalFailure[1]) * 60 }, deathAtZero: true, note: `${death[1]}; ${death[2]}.` },
        sentences: [lead[1], lead[2], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(row)]
    };
}
