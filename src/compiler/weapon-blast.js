// A basic save whose damage is the caster's melee weapon's (Invoke the Crimson Oath; user decision 2026-10-01: a critical failure takes the
// weapon's critical damage roll):
//   "You must be wielding a melee weapon, and you perform this spell's somatic component by swinging the weapon in a downward arc." / "You deal
//   normal melee damage for your weapon, including all appropriate bonuses, penalties, modifiers, and properties, to each creature in the
//   spell's area; they must each attempt a basic Fortitude save." / "A creature that critically fails this save also suffers any additional
//   effect you would normally inflict with your weapon on a critical hit; if the creature that critically fails its save is also immune to
//   critical hits, it merely fails the save instead." / "You can convert all the physical damage from this spell into vitality damage against
//   all undead creatures in the area."
// Rewritten to the ordinary basic save of the creatures in the area; the damage is PF2e's Strike damage roll for the melee weapon the caster
// holds (picked when cast), a critically failing creature takes PF2e's critical damage roll for it instead of double (its critical
// specialization is the GM's reminder), one immune to critical hits takes the failure's; the caster says whether undead take vitality.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const WIELD = /^You must be wielding a melee weapon, and you perform this spell's somatic component by swinging the weapon in a downward arc\.$/;
const DEAL = /^You deal normal melee damage for your weapon, including all appropriate bonuses, penalties, modifiers, and properties, to each creature in the spell's area; they must each attempt a basic (Fortitude|Reflex|Will) save\.$/;
const CRITICAL = /^A creature that critically fails this save also suffers any additional effect you would normally inflict with your weapon on a critical hit; if the creature that critically fails its save is also immune to critical hits, it merely fails the save instead\.$/;
const CONVERT = /^You can convert all the physical damage from this spell into (vitality|void) damage against all (undead|living) creatures in the area\.$/;

/** {html, weaponDamage, reminder, sentences} or null. */
export function extractWeaponBlast(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || (adapted.damageComponents ?? []).length || !adapted.targeting?.area) return null;
    if (String(adapted.lifecycle?.duration ?? "").trim() || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => WIELD.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const deal = DEAL.exec(sentences[at + 1]), convert = CONVERT.exec(sentences[at + 3]);
    if (!deal || !CRITICAL.test(sentences[at + 2]) || !convert || deal[1].toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>Each creature in the area takes 1d6 untyped damage (basic ${deal[1]} save).</p>`,
        weaponDamage: { requirement: "melee", criticalRoll: true, critImmuneFails: true, convert: { to: convert[1], trait: convert[2], optional: true }, sourceText: sentences[at + 1] },
        reminder: { kind: "weapon-critical", text: "A creature that critically fails takes the weapon's critical damage roll (deadly, fatal and the like included); apply the weapon's critical specialization effect yourself if the caster has it.", sourceText: sentences[at + 2] },
        sentences: sentences.slice(at)
    };
}
