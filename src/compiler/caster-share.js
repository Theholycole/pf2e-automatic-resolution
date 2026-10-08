// A save the caster shares with the target (Debilitating Dichotomy): "You and the target each take 9d6 mental damage with a basic Will save,
// and the target is @UUID[…]{Stunned 1} if it critically fails its save." / "You get a degree of success one better than you rolled for your
// saving throw.": the target's basic save with its critical-failure rider, and the caster saving too with its result one degree better (the
// card adds the caster; one degree better never leaves the caster a critical failure, so the rider stays the target's).
import { htmlToPlainText } from "./description-parser.js";
import { BETTER, CONDITION_LINK_START as C, NARRATION_RULES } from "./text-patterns.js";

const SHARE = new RegExp(String.raw`^You and the target each take (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save, and the target is (${C}[A-Z][a-z]+(?: \d)?\}) if it critically fails its save\.$`);
const BETTER_SENTENCE = /^You get a degree of success one better than you rolled for your saving throw\.$/;

/** {html, degreeAdjustment, sentences} or null. */
export function rewriteCasterShare(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    if (!/^1 creature other than you$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !BETTER_SENTENCE.test(sentences[2])) return null;
    const share = SHARE.exec(sentences[1]);
    if (!share || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== share[1]
        || String(components[0].type).toLowerCase() !== share[2] || share[3].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>The target takes ${share[1]} ${share[2]} damage with a basic ${share[3]} save. A creature that critically fails the save is also ${share[4]}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        degreeAdjustment: { predicate: { kind: "caster" }, map: { ...BETTER }, sourceText: sentences[2] },
        sentences: sentences.slice(1)
    };
}
