// Note-only spells with a save or an area the module can run (Verminous Lure, Extradimensional Cover, Perfected Mind).
import { plainText as plain, splitSentences as split } from "./description-parser.js";
import { NARRATION_RULES_CHECKS as NARRATION_RULES, secondsOf } from "./text-patterns.js";

// Verminous Lure: "Upon casting, the target emits a musk that's captivating to certain animals. Tiny animals and animal swarms of any size within
// range must attempt a Will save. On a failure, non-hostile animals or animal swarms try to touch the target. If hostile, such creatures choose to
// attack the target instead of other foes, …" — the target's Effect for the duration (the scent note); each Tiny animal and each animal swarm
// within range rolls its Will save against the spell DC, and those that fail get the lure's Effect (what they do is the GM's, from its text).
const LURE = /^Tiny animals and animal swarms of any size within range must attempt a (Fortitude|Reflex|Will) save\.$/;
const LURE_FAIL = /^On a failure, non-hostile animals or animal swarms try to touch the target\.$/;
const LURE_HOSTILE = /^If hostile, such creatures choose to attack the target instead of other foes, if able to do so without spending additional actions or exposing themselves to additional danger\.$/;
export function compileLureSave(adapted) {
    if (!/^1 creature or object$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const sentences = split(plain(adapted.descriptionHTML ?? ""));
    const at = sentences.findIndex(sentence => LURE.test(sentence));
    if (!range || !seconds || at < 0 || !LURE_FAIL.test(sentences[at + 1] ?? "") || !LURE_HOSTILE.test(sentences[at + 2] ?? "") || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const after = sentences.slice(at + 3);
    if (after.some(sentence => /\d|\b(?:damage|bonus|penalty|saves?|DC)\b/.test(sentence))) return null;
    return { lureSave: { save: LURE.exec(sentences[at])[1].toLowerCase(), rangeFeet: Number(range[1]), seconds, who: { trait: "animal", sizes: ["tiny"], anySizeTraits: ["swarm"] },
        failure: `${sentences[at + 1]} ${sentences[at + 2]}`, notes: after }, claimed: sentences };
}

// Extradimensional Cover: "You create this extradimensional cover in a square within range that is either empty or occupied by you or an ally.
// The extradimensional cover doesn't impede movement through it, but only you and your allies can end your movement in the space. If another
// creature attempts to end their movement in the cover, they are pushed to the nearest unoccupied space chosen at random. … which provide standard
// cover to any creature occupying the space." — the square placed for the duration; a creature in it has standard cover (+2 circumstance to AC,
// Reflex saves against area effects, and Stealth to Hide, Sneak or Avoid Notice); a creature not the caster's side that stops in it is moved to a
// random free space next to it.
const COVER = [/^You create this [a-z ]+ in a square within range that is either empty or occupied by you or an ally\.$/,
    /^The [a-z ]+ doesn't impede movement through it, but only you and your allies can end your movement in the space\.$/,
    /^If another creature attempts to end their movement in the cover, they are pushed to the nearest unoccupied space chosen at random\.$/,
    /^The space merges reality with your demiplane, creating swaths of semi-real debris which provide (lesser|standard|greater) cover to any creature occupying the space\.$/];
const COVER_BONUS = { lesser: 1, standard: 2, greater: 4 };
export function compileCoverSquare(adapted) {
    const area = adapted.targeting?.area;
    if (area?.type !== "square" || String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const seconds = secondsOf(adapted.lifecycle?.duration);
    const sentences = split(plain(adapted.descriptionHTML ?? ""));
    const at = sentences.findIndex(sentence => COVER[0].test(sentence));
    if (!seconds || at < 0 || sentences.length !== at + COVER.length || COVER.some((pattern, index) => !pattern.test(sentences[at + index])) || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const degree = COVER[3].exec(sentences[at + 3])[1];
    const value = COVER_BONUS[degree];
    return { coverSquare: { size: Number(area.value), seconds, degree, pushesOthers: true,
        rules: [{ key: "FlatModifier", selector: "ac", type: "circumstance", value },
            { key: "FlatModifier", selector: "reflex", type: "circumstance", value, predicate: ["area-effect"] },
            { key: "FlatModifier", selector: "stealth", type: "circumstance", value, predicate: [{ or: ["action:hide", "action:sneak", "action:avoid-notice"] }] }] },
        claimed: sentences };
}

// Perfected Mind: "Attempt a new Will save against one mental effect currently affecting you that required a Will save. Use the result of this new
// save to determine the outcome of the mental effect, unless the new save would have a worse result than the original save, in which case nothing
// happens. You can use perfected mind against a given effect only once." — for a mental spell the module resolved with a Will save on the caster
// (its Effects still on them), a new Will save against that DC; a better result replaces that row's Effects with the new row's; once per effect.
const RETRY = /^Attempt a new (Fortitude|Reflex|Will) save against one ([a-z]+) effect currently affecting you that required a \1 save\.$/;
const RETRY_USE = /^Use the result of this new save to determine the outcome of the [a-z]+ effect, unless the new save would have a worse result than the original save, in which case nothing happens\.$/;
const RETRY_ONCE = /^You can use [a-z ]+ against a given effect only once\.$/;
export function compileSaveRetry(adapted) {
    if (String(adapted.targeting?.target ?? "").trim() || String(adapted.lifecycle?.duration ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const sentences = split(plain(String(adapted.descriptionHTML ?? "").replace(/<\/?em>/g, "")));
    const at = sentences.findIndex(sentence => RETRY.test(sentence));
    if (at < 0 || !RETRY_USE.test(sentences[at + 1] ?? "") || !RETRY_ONCE.test(sentences[at + 2] ?? "") || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, save, trait] = RETRY.exec(sentences[at]);
    return { saveRetry: { save: save.toLowerCase(), trait, keepBetter: true, oncePerEffect: true }, claimed: sentences };
}

export const DEGREE_ORDER = ["criticalFailure", "failure", "success", "criticalSuccess"];
/** Whether a creature (its traits and size) is one the lure calls. */
export function lured(data, { traits = [], size = "med" } = {}) {
    if (!traits.includes(data.who.trait)) return false;
    return data.who.sizes.includes(size) || data.who.anySizeTraits.some(trait => traits.includes(trait));
}
