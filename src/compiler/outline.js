// Creatures outlined so they can't hide in concealment (Faerie Fire):
//   "All creatures in the area when you cast the spell are limned in colorful, heatless fire of a color of your choice for the duration." /
//   "Visible creatures can't be Concealed while affected by faerie fire." / "If the creatures are Invisible, they are Concealed while affected by
//   faerie fire, rather than being Undetected."
// Each creature in the area (targeted) gets an Effect for the duration: it grants Concealed while the creature is Invisible, and while it isn't,
// a Concealed condition it gains is removed (`outlineOnCondition`).
import { htmlToPlainText } from "./description-parser.js";

const LIMNED = /^All creatures in the area when you cast the spell are limned in [a-z ,-]+ for the duration\.$/;
const VISIBLE = /^Visible creatures can't be @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Concealed\} while affected by [a-z ]+\.$/;
const INVISIBLE = /^If the creatures are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Invisible\}, they are Concealed while affected by [a-z ]+, rather than being @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Undetected\}\.$/;

/** Returns {outline, claimed} or null. */
export function compileOutline(adapted) {
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || !area || !fixed || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = String(adapted.descriptionHTML ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3 || !LIMNED.test(sentences[0]) || !VISIBLE.test(sentences[1]) || !INVISIBLE.test(sentences[2])) return null;
    return {
        outline: { area: { type: area.type, value: Number(area.value) }, concealedUuid: VISIBLE.exec(sentences[1])[1],
            duration: { value: Number(fixed[1]), unit: `${fixed[2].toLowerCase()}s` } },
        claimed: sentences.map(sentence => htmlToPlainText(sentence))
    };
}
