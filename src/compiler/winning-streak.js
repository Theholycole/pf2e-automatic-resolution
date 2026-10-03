// A streak kept alive by critical hits (Winning Streak): "… It gains the {Quickened} condition for 1 round. If the target or one of their allies within 20 feet gets
// a critical success on an attack roll against a significant foe, whoever got the critical success becomes quickened if they weren't already, and the
// duration of the winning streak is extended by another round. Creatures quickened by the spell can use the extra action to Strike, Step, or Stride. If a
// full round passes without the target or one their allies critically succeeding on an attack roll against a significant foe, the winning streak breaks and
// the spell ends.": Quickened (held by an Effect for the streak, its extra action limited) on the target; the GM's control when the targeted creature (the
// target or an ally within the distance) critically hits a significant foe — it's quickened too, and the streak goes on; a full round without one ends it.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Quickened)\}`;
const GAINS = new RegExp(String.raw`^It gains the ${C} condition for 1 round\.$`);
const SPREAD = /^If the target or one of their allies within (\d+) feet gets a critical success on an attack roll against a significant foe, whoever got the critical success becomes quickened if they weren't already, and the duration of the [a-z ]+ is extended by another round\.$/;
const LIMIT = /^Creatures quickened by the spell can use the extra action to (Strike, Step, or Stride)\.$/;
const BREAKS = /^If a full round passes without the target or one their allies critically succeeding on an attack roll against a significant foe, the [a-z ]+ breaks and the spell ends\.$/;

/** {winningStreak, claimed} or null. */
export function compileWinningStreak(adapted) {
    if (adapted.defense?.kind === "save" || !/^1 creature$/.test(String(adapted.targeting?.target ?? "").trim()) || !/^1 round\b/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => GAINS.test(sentence));
    if (at < 0 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty)\b/i.test(sentence))) return null;
    const gains = GAINS.exec(sentences[at]), spread = SPREAD.exec(sentences[at + 1]), limit = LIMIT.exec(sentences[at + 2]);
    if (!gains || !spread || !limit || !BREAKS.test(sentences[at + 3])) return null;
    return {
        winningStreak: { condition: { slug: "quickened", uuid: gains[1] }, radius: Number(spread[1]), limit: limit[1], sourceText: sentences[at + 1] },
        claimed: sentences
    };
}
