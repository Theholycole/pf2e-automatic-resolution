// A light the caster sheds that helps everyone in it find what's hidden (Light of Revelation):
//   "You shed a luminous aura, illuminating a 30-foot radius with bright light." / "You and all allies in this area gain a +1 status bonus to
//   Perception checks to detect Hidden or Undetected creatures, as well as Hidden objects, doors, and other features."
// An Effect on the caster: the light, and PF2e's Aura giving the caster and its allies within the radius an Effect with the bonus to Seek (the
// Perception check to detect what's hidden). The aura's Effect is a world Effect the module keeps for the spell.
import { htmlToPlainText } from "./description-parser.js";

const LIGHT = /^You shed a luminous aura, illuminating a (\d+)-foot radius with bright light\.$/;
const BONUS = /^You and all allies in this area gain a \+(\d) status bonus to Perception checks to detect (?:@UUID\[[^\]]+\]\{Hidden\}|Hidden) or (?:@UUID\[[^\]]+\]\{Undetected\}|Undetected) creatures, as well as Hidden objects, doors, and other features\.$/;

/** Returns {lightAura, claimed} or null. */
export function compileLightAura(adapted) {
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || !fixed || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 2) return null;
    const light = LIGHT.exec(sentences[0]), bonus = BONUS.exec(sentences[1]);
    if (!light || !bonus) return null;
    return {
        lightAura: { radius: Number(light[1]), durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60),
            bonus: { selector: "perception", type: "status", value: Number(bonus[1]), predicate: ["action:seek"] } },
        claimed: sentences
    };
}
