// A spellshape storm around the caster's next spell (Elemental Tempest): "Your spellcasting surrounds you in a storm of elemental energy." / "If the next action you take
// is to Cast a Spell from your wizard spell slots that's an evocation spell dealing acid, cold, electricity, or fire damage, a 10-foot emanation of energy surrounds you
// as you cast the spell." / "Foes in the area take 1d6 damage per spell rank of the spell you just cast of the same damage type the spell deals (choose one if it deals
// multiple types)." / "Combine the damage from both elemental tempest and the other spell against foes who take damage from both before applying bonuses, penalties,
// resistance, weakness, and the like." PF2e's Remaster removed schools: the caster confirms the spell qualifies (a legacy evocation; the user's ruling of 2026-10-03),
// its rank and the type; the foes in the emanation take the damage, and for those the spell also damaged the module undoes the second application of their
// resistance and weakness (as if the damage were combined: the spell's own damage taken to beat the resistance).
import { htmlToPlainText } from "./description-parser.js";

const OPEN = /^Your spellcasting surrounds you in a storm of elemental energy\.$/;
const NEXT = /^If the next action you take is to Cast a Spell from your ([a-z]+) spell slots that's an ([a-z]+) spell dealing ([a-z, ]+) damage, a (\d+)-foot emanation of energy surrounds you as you cast the spell\.$/;
const FOES = /^Foes in the area take (\d+)d(\d+) damage per spell rank of the spell you just cast of the same damage type the spell deals \(choose one if it deals multiple types\)\.$/;
const COMBINE = /^Combine the damage from both [a-z ]+ and the other spell against foes who take damage from both before applying bonuses, penalties, resistance, weakness, and the like\.$/;

/** {spellStorm, claimed} or null. */
export function compileSpellStorm(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || !(adapted.activation?.traits ?? []).includes("spellshape") || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const next = NEXT.exec(sentences[1] ?? ""), foes = FOES.exec(sentences[2] ?? "");
    if (sentences.length !== 4 || !OPEN.test(sentences[0]) || !next || !foes || !COMBINE.test(sentences[3])) return null;
    const area = adapted.targeting?.area;
    if (area && (area.type !== "emanation" || Number(area.value) !== Number(next[4]))) return null;
    if (components.length > 1 || (components[0] && String(components[0].formula).replace(/\s+/g, "") !== `${foes[1]}d${foes[2]}`)) return null;
    const types = next[3].split(/,\s*(?:or\s+)?|\s+or\s+/).map(type => type.trim()).filter(Boolean);
    return { spellStorm: { slots: next[1], school: next[2], types, radius: Number(next[4]), perRank: { dice: Number(foes[1]), die: Number(foes[2]) }, combine: true }, claimed: sentences };
}
