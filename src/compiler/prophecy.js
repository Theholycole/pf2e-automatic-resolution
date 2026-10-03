// A prophecy on a save (Prophet's Luck): "Trigger You or a creature within range attempts a saving throw against an obvious threat." / "You prophesize the result
// of the triggering saving throw as either a success (including a critical success) or a failure (including a critical failure). The target gains a +1
// status bonus to the save if you predict success or a –1 status penalty if you predict failure. If you predict the result correctly, fortune favors you, and
// you gain a +1 status bonus to saving throws. If you predict incorrectly, fortune spurns the target, imparting a –1 status penalty to its saving throws." with
// "Heightened (6th) … +2 or –2." / "Heightened (9th) … +3 or –3.": the caster's prediction (asked when cast); the target's modifier on its next save, used up by
// that save; that save's result decides the aftermath for the spell's duration — the caster's bonus to saves, or the target's penalty.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^Trigger You or a creature within range attempts a saving throw against an obvious threat\.$/;
const S = [
    /^You prophesize the result of the triggering saving throw as either a success \(including a critical success\) or a failure \(including a critical failure\)\.$/,
    /^The target gains a \+(\d) status bonus to the save if you predict success or a [–-](\d) status penalty if you predict failure\.$/,
    /^If you predict the result correctly, fortune favors you, and you gain a \+(\d) status bonus to saving throws\.$/,
    /^If you predict incorrectly, fortune spurns the target, imparting a [–-](\d) status penalty to its saving throws\.$/
];
const STEP = /^Heightened \((\d)(?:st|nd|rd|th)\) The save bonus or penalty increases to \+(\d) or [–-](\d)\.$/;

/** {prophecy, claimed} or null. */
export function compileProphecy(adapted) {
    if (adapted.defense?.kind === "save" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || !/^1 creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [trigger, body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length || !TRIGGER.test(htmlToPlainText(trigger).replace(/\s+/g, " ").trim())) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const matches = S.map((pattern, index) => pattern.exec(sentences[index] ?? ""));
    if (sentences.length !== 4 || matches.some(match => !match)) return null;
    const base = Number(matches[1][1]);
    if ([matches[1][2], matches[2][1], matches[3][1]].some(value => Number(value) !== base)) return null;
    const steps = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => STEP.exec(htmlToPlainText(match[1]).replace(/\s+/g, " ").trim()));
    if (steps.some(step => !step || step[2] !== step[3])) return null;
    return {
        prophecy: { base, byRank: steps.map(step => ({ rank: Number(step[1]), value: Number(step[2]) })), minutes: Number(minutes[1]), predictions: ["success", "failure"] },
        claimed: [htmlToPlainText(trigger).trim(), ...sentences, ...steps.map(step => step[0])]
    };
}

/** The modifier at the cast rank. */
export function prophecyValue(prophecy, castRank) {
    return [...prophecy.byRank].sort((left, right) => right.rank - left.rank).find(step => castRank >= step.rank)?.value ?? prophecy.base;
}
