// Damage to an unattended object (Shatter; user decision 2026-10-01: rolled on the card, the GM applies it to the object):
//   "A high-frequency sonic attack shatters a nearby object." / "You deal 2d10 sonic damage to the object, ignoring the object's Hardness if it
//   is 4 or lower." with "Heightened (+1) The damage increases by 1d10, and the Hardness the spell ignores increases by 2."
// Casting rolls the damage at the cast rank and states the Hardness the spell ignores at that rank; PF2e has no document for an unattended
// object on the map, so the GM applies it (an item's Hit Points, or the scenery's).
import { htmlToPlainText } from "./description-parser.js";

const DAMAGE = /^You deal (\d+)d(\d+) ([a-z]+) damage to the object, ignoring the object's Hardness if it is (\d+) or lower\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+), and the Hardness the spell ignores increases by (\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|Hardness)\b/i;

/** Returns {objectDamage, claimed} or null. */
export function compileObjectDamage(adapted) {
    if (adapted.defense?.kind !== "none" || !/^1 unattended object$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let damage = null, narrated = 0;
    for (const sentence of sentences) {
        const match = !damage ? DAMAGE.exec(sentence) : null;
        if (match) { damage = { sentence, count: Number(match[1]), faces: Number(match[2]), type: match[3], hardness: Number(match[4]) }; continue; }
        if (!damage && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!damage || `${damage.count}d${damage.faces}` !== String(components[0].formula).replace(/\s+/g, "") || String(components[0].type).toLowerCase() !== damage.type) return null;
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    if (entries.length > 1) return null;
    const step = entries.length ? STEP.exec(entries[0]) : null;
    if (entries.length && !(step && Number(step[3]) === damage.faces && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${step[3]}`)) return null;
    return {
        objectDamage: { count: damage.count, faces: damage.faces, type: damage.type, hardness: damage.hardness, baseRank: Number(adapted.rank) || 1,
            ...(step ? { step: { interval: Number(step[1]), dice: Number(step[2]), hardness: Number(step[4]) } } : {}) },
        claimed: [damage.sentence, ...(step ? [htmlToPlainText(entries[0]).trim()] : [])]
    };
}

/** The dice and the Hardness the spell ignores at a cast rank. */
export function objectDamageAt(data, castRank) {
    const steps = data.step ? Math.max(0, Math.floor((Number(castRank) - data.baseRank) / data.step.interval)) : 0;
    return { formula: `${data.count + steps * (data.step?.dice ?? 0)}d${data.faces}`, type: data.type, hardness: data.hardness + steps * (data.step?.hardness ?? 0) };
}
