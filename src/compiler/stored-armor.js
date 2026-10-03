// Armor stored away until the caster calls it back (Instant Armor; user decision 2026-10-01: Effect + note spells count once the module covers what
// PF2e's Effect doesn't):
//   "Upon casting this spell, the armor you're wearing is whisked away into an extradimensional space that's linked to you." / "If the armor is
//   magical and invested by you, it remains invested while in this space, though you don't gain its benefits." / "You then gain the Armor Up!
//   action; once you use the action, the spell ends." / "If the action hasn't been used by the time the spell's duration ends, the
//   extradimensional space collapses, ejecting the armor's pieces on the ground under you."
// PF2e's Effect grants the action; the module takes the worn armor off when the spell is cast, and puts it back on (ending the spell) when the
// action is used; at the end of the duration it stays off (the GM drops it under the caster).
import { htmlToPlainText } from "./description-parser.js";

const SENTENCES = [
    /^Upon casting this spell, the armor you're wearing is whisked away into an extradimensional space that's linked to you\.$/,
    /^If the armor is magical and invested by you, it remains invested while in this space, though you don't gain its benefits\.$/,
    /^You then gain the (?:@UUID\[(Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+)\]\{[^}]+\}|Armor Up!) action; once you use the action, the spell ends\.$/,
    /^If the action hasn't been used by the time the spell's duration ends, the extradimensional space collapses, ejecting the armor's pieces on the ground under you\.$/
];

/** Returns {storedArmor, claimed} or null. */
export function compileStoredArmor(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const fixed = /^(\d+) (hour|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed || /<hr\b|Heightened/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])].filter(effect => effect.resolutionStatus === "resolved");
    if (links.length !== 1) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "").replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== SENTENCES.length || !sentences.every((sentence, index) => SENTENCES[index].test(sentence))) return null;
    const action = SENTENCES[2].exec(sentences[2])[1];
    const rules = links[0].document?.mechanics?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "GrantItem" || (action && rules[0].uuid !== action)) return null;
    return {
        storedArmor: { actionUuid: rules[0].uuid, effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference },
            note: sentences[3] },
        claimed: sentences
    };
}
