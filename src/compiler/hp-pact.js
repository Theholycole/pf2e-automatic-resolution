// A pact that pools Hit Points against a lethal blow (Life Pact): "If one of the targets is about to take damage that would reduce it to 0 Hit Points,
// all other targets immediately lose 3 Hit Points and the triggering target regains a number of Hit Points equal to the Hit Points lost this way,
// just before taking the damage. If this healing is enough that the triggering target is no longer reduced to 0 Hit Points, they remain
// conscious. Once the triggering target has regained Hit Points from the other targets, the spell ends." with "Heightened (+1) Increase the number
// of Hit Points lost by 1 for each target other than the one reduced to 0 Hit Points. The target reduced to 0 Hit Points regains that many
// additional Hit Points." — an Effect on each target for the duration; damage that would take one to 0 Hit Points (PF2e's update) first takes the
// stated Hit Points from each other target still in the pact and gives their total to it; then every target's Effect ends.
import { durationSeconds, plainText as plain, splitSentences as split } from "./description-parser.js";

const TRIGGER = /^If one of the targets is about to take damage that would reduce it to 0 Hit Points, all other targets immediately lose (\d+) Hit Points and the triggering target regains a number of Hit Points equal to the Hit Points lost this way, just before taking the damage\.$/;
const CONSCIOUS = /^If this healing is enough that the triggering target is no longer reduced to 0 Hit Points, they remain conscious\.$/;
const ENDS = /^Once the triggering target has regained Hit Points from the other targets, the spell ends\.$/;
const STEP = /^Heightened \(\+(\d)\) Increase the number of Hit Points lost by (\d+) for each target other than the one reduced to 0 Hit Points\. The target reduced to 0 Hit Points regains that many additional Hit Points\.$/;

/** Returns {hpPact, claimed} or null. */
export function compileHpPact(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    const count = /^up to (\d+) willing creatures$/i.exec(String(adapted.targeting?.target ?? "").trim());
    const seconds = durationSeconds(adapted.lifecycle?.duration);
    if (!count || !seconds) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => TRIGGER.test(sentence));
    const heightened = plain(rest.join(" ")).trim();
    const step = STEP.exec(heightened);
    if (at < 0 || sentences.length !== at + 3 || !CONSCIOUS.test(sentences[at + 1]) || !ENDS.test(sentences[at + 2]) || (heightened && !step)
        || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|Hit Points|saves?|bonus|penalty|conditions?)\b/i.test(sentence))) return null;
    return { hpPact: { targets: Number(count[1]), seconds, amount: Number(TRIGGER.exec(sentences[at])[1]), step: step ? { interval: Number(step[1]), amount: Number(step[2]) } : null,
        sourceText: sentences[at] }, claimed: [...sentences, heightened].filter(Boolean) };
}

/** The Hit Points each other target loses at a cast rank. */
export function pactAmount(data, castRank, baseRank) {
    return data.amount + (data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) * data.step.amount : 0);
}
