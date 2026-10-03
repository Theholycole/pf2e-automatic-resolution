// Temporary Hit Points from a triggering creature: Death's Call — "You gain temporary Hit Points equal to the triggering creature's
// level plus your spellcasting attribute modifier. If the triggering creature was undead, double the number of temporary Hit Points
// you gain. These last for the duration of the spell, and the spell ends if all the temporary Hit Points are depleted earlier."
// The GM targets the triggering creature; the caster gets PF2e's TempHP on an Effect lasting the spell's duration.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const GAIN = /^You gain temporary Hit Points equal to the triggering creature's level plus your spellcasting attribute modifier\.$/;
const UNDEAD_DOUBLE = /^If the triggering creature was undead, double the number of temporary Hit Points you gain\.$/;
const LASTS = /^These last for the duration of the spell, and the spell ends if all the temporary Hit Points are depleted earlier\.$/;
const TRIGGER = /^Trigger (A living creature within \d+ feet of you dies, or an undead creature within \d+ feet of you is destroyed\.)/;

/** Returns {tempHp} or null. */
export function compileTempHpReaction(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || nativeSpellEffects.references.length || adapted.targeting?.area) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!duration) return null;
    const plain = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML));
    const trigger = TRIGGER.exec(plain);
    if (!trigger) return null;
    const sentences = plain.slice(trigger[0].length).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let gain = null, undead = false, lasts = false, narrated = 0;
    for (const sentence of sentences) {
        if (GAIN.test(sentence)) { gain = sentence; continue; }
        if (UNDEAD_DOUBLE.test(sentence) && gain) { undead = true; continue; }
        if (LASTS.test(sentence) && gain) { lasts = true; continue; }
        if (!gain && narrated < 1 && !/\d|@|\b(?:damage|Hit Points|save|bonus|penalty)\b/i.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!gain || !lasts) return null;
    return { tempHp: { trigger: trigger[1], doubleIfUndead: undead, duration: { value: Number(duration[1]), unit: `${duration[2].toLowerCase()}s` }, sourceText: gain } };
}
