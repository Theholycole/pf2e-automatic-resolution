// A reaction trading the caster's Hit Points for a reduction of a target's damage, any excess healing it (Shepherd of Souls): "You lose up to 15 Hit Points as a
// sacrifice, and the target reduces the damage by twice the number of Hit Points sacrificed. If this reduction exceeds the amount of damage, the target recovers
// Hit Points equal to the excess amount." with "Heightened (+2) The maximum number of Hit Points you can sacrifice increases by 5." — the caster picks the
// sacrifice (at most the rank's maximum and its own Hit Points) and loses it; the target regains twice that after the triggering damage (the reduction up to the
// damage plus the excess are together that much), back from Dying if it was.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    lose: /^You lose up to (\d+) Hit Points as a sacrifice, and the target reduces the damage by (twice|three times) the number of Hit Points sacrificed\.$/,
    excess: /^If this reduction exceeds the amount of damage, the target recovers Hit Points equal to the excess amount\.$/
};
const STEP = /^Heightened \(\+(\d)\) The maximum number of Hit Points you can sacrifice increases by (\d+)\.$/;

/** {sacrificeHeal, claimed} or null. */
export function compileSacrificeHeal(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    if (String(adapted.activation?.time ?? "").trim() !== "reaction") return null;
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
    return { sacrificeHeal: { max: Number(claimed.lose[1]), multiplier: claimed.lose[2] === "twice" ? 2 : 3, step: step ? { interval: Number(step[1]), add: Number(step[2]) } : null },
        claimed: [...sentences, ...(step ? [stepText] : [])] };
}

/** The most Hit Points the caster can sacrifice at a cast rank. */
export function sacrificeMax(data, castRank, baseRank) {
    return data.max + (data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) * data.step.add : 0);
}
