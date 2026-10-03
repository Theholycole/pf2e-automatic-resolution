// Healing from the round's first damaging weapon Strike (Shall not Falter, Shall not Rout): "The first time each round that you Strike with your weapon and deal
// damage to a foe, you recover a number of HP equal to twice shall not falter, shall not rout's level. This healing can't raise your current HP above half of your
// maximum HP." — the caster's Effect for the duration with the card's control (once each round): it recovers the multiple of the cast rank, no higher than the cap.
import { htmlToPlainText } from "./description-parser.js";

const WORDS = { twice: 2, "three times": 3, "four times": 4 };
const HEAL = /^The first time each round that you Strike with your weapon and deal damage to a foe, you recover a number of HP equal to (twice|three times|four times) [a-z ,]+'s level\.$/;
const CAP = /^This healing can't raise your current HP above half of your maximum HP\.$/;

/** {strikeHeal, claimed} or null. */
export function compileStrikeHeal(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || /<hr/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== 3 || /\d|@|\b(?:damage|save|bonus|penalty)\b/.test(sentences[0]) || !HEAL.test(sentences[1]) || !CAP.test(sentences[2])) return null;
    return { strikeHeal: { seconds: Number(minutes[1]) * 60, multiple: WORDS[HEAL.exec(sentences[1])[1]], capFraction: 0.5 }, claimed: sentences };
}
