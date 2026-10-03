// Stealing knowledge or a spell, with damage by what was stolen (Umbral Mindtheft, Umbral Extraction; user decision 2026-10-01: rolled on
// the card, the GM applies the rest):
//   "During the spell's duration, you can use the Steal action to attempt to take one Lore skill proficiency … You can also make one attempt to
//   Steal as part of Casting the Spell. If you succeed at your check to Steal a Lore skill, you deal 2d6 mental damage to the target if they were
//   trained in that skill, plus @Damage[2d6[mental]] damage per proficiency rank they have in that skill above trained, …" /
//   "… If you succeed at your check to Steal a spell, you deal 1d4 mental damage to the target per rank of the spell stolen …"
// Casting gives the caster a note with the spell's rules for its duration and posts a Steal card: PF2e's Steal (Thievery against the target's
// Perception DC) against the targeted creature; on a success the GM names what was taken (the Lore's proficiency rank, or the stolen spell's
// rank) and the module rolls and applies the damage. Once something is taken, the card's Steal ends. Which Lore or spell, the proficiency or
// slot gained, and how long it lasts are the GM's (the note).
import { htmlToPlainText } from "./description-parser.js";

const STEAL_ACTION = /\byou can use the Steal action to attempt to take (?:one Lore skill proficiency|one of the foe's prepared spells or unused spontaneous spell slots) (?:from (?:a creature|the foe) )?instead of (?:Stealing )?an item\./i;
const STEAL_ON_CAST = /\bYou can also make one attempt to Steal as part of Casting (?:the Spell|[a-z ]+)\./;
const LORE = /\bIf you succeed at your check to Steal a Lore skill, you deal (\d)d(\d+) mental damage to the target if they were trained in that skill, plus @Damage\[\1d\2\[mental\]\] damage per proficiency rank they have in that skill above trained, as [^.]+\./;
const SPELL = /\bIf you succeed at your check to Steal a spell, you deal (\d)d(\d+) mental damage to the target per rank of the spell stolen due to [^.]+, and you place the stolen spell in your temporary spell slot\./;

/** Returns {stealDamage, claimed} or null. */
export function compileStealDamage(adapted) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const fixed = /^(\d+) (round|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b|Heightened/i.test(html)) return null;
    const text = htmlToPlainText(html).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    if (!STEAL_ACTION.test(text) || !STEAL_ON_CAST.test(text)) return null;
    const lore = LORE.exec(text), spell = SPELL.exec(text);
    if (!!lore === !!spell) return null;
    const key = (lore ?? spell)[0];
    // Nothing else may deal damage or roll dice: the rest is which Lore or spell, what the caster gains and for how long (the GM's).
    const rest = text.replace(key, "");
    if (/@Damage|\b\d+d\d+\b|\bdamage\b/i.test(rest)) return null;
    const components = adapted.damageComponents ?? [];
    const [count, faces] = [Number((lore ?? spell)[1]), Number((lore ?? spell)[2])];
    if (components.length > 1 || (components.length === 1 && (String(components[0].formula).replace(/\s+/g, "") !== `${count}d${faces}` || String(components[0].type).toLowerCase() !== "mental"))) return null;
    return {
        stealDamage: { kind: lore ? "lore" : "spell", count, faces, type: "mental", durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60), text },
        claimed: [key, STEAL_ACTION.exec(text)[0], STEAL_ON_CAST.exec(text)[0]]
    };
}

/** The damage for what was stolen: a Lore's proficiency rank (1 trained … 4 legendary), or the stolen spell's rank. */
export function stealDamageFormula(data, amount) {
    const units = Number(amount);
    if (!Number.isInteger(units) || units < 1) return null;
    return `${units * data.count}d${data.faces}[${data.type}]`;
}
