// A repulsion around the caster that hinders metal (Magnetic Repulsion; user decisions 2026-10-01: an attack's metal is a penalty Effect the GM
// gives the attacker; the selective terrain is the module's region):
//   "Attacks made with metal objects against you take a -1 status penalty, and the squares adjacent to you are difficult terrain for creatures
//   wearing metal armor." / "For creatures made entirely of metal, the penalty to their attack rolls is -2 and the squares adjacent to you are
//   greater difficult terrain." / "While this spell is active, you require an additional Interact action before using a metal object (including
//   to Strike with a metal weapon), and if you're wearing metal armor, you're Slowed 1." with "Heightened (+3) The status penalty to attack
//   rolls increases by 1."
// When cast, the GM confirms who wears metal armor and who is made entirely of metal (detected from PF2e's armor and traits). The squares
// adjacent to the caster are a region following its token, difficult terrain for the metal-armored creatures and greater for the metal ones only
// (per-creature terrain); the caster's Effect carries Slowed 1 when it wears metal armor, and the extra Interact as a note. The record's control
// gives a creature attacking the caster with a metal object a one-roll status penalty (−1, −2 if made of metal, +1 per step).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const FIRST = /^Attacks made with metal objects against you take an? [-–−](\d) status penalty, and the squares adjacent to you are difficult terrain for creatures wearing metal armor\.$/;
const SECOND = /^For creatures made entirely of metal, the penalty to their attack rolls is [-–−](\d) and the squares adjacent to you are greater difficult terrain\.$/;
const THIRD = /^While this spell is active, you require an additional Interact action before using a metal object \(including to Strike with a metal weapon\), and if you're wearing metal armor, you're (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Slowed (\d)\})\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The status penalty to attack rolls increases by (\d)\.\s*<\/p>$/;

/** Returns {repulsionAura, claimed} or null. */
export function compileRepulsionAura(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || adapted.lifecycle?.sustained) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => FIRST.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const first = FIRST.exec(sentences[at]), second = SECOND.exec(sentences[at + 1]), third = THIRD.exec(sentences[at + 2]), step = STEP.exec(rest[0]);
    if (!second || !third || !step || Number(second[1]) <= Number(first[1])) return null;
    return {
        repulsionAura: {
            durationSeconds: Number(minutes[1]) * 60,
            penalty: { base: Number(first[1]), metal: Number(second[1]), step: { interval: Number(step[1]), add: Number(step[2]) } },
            terrain: { armor: 2, metal: 3 },
            casterCondition: { link: third[1], slug: "slowed", value: Number(third[2]), when: "metal-armor" },
            notes: ["You need an additional Interact action before using a metal object (including to Strike with a metal weapon)."]
        },
        claimed: [...sentences.slice(at), htmlToPlainText(rest[0]).trim()]
    };
}

/** The penalty at a cast rank for a creature (made of metal or not). */
export function repulsionPenalty(aura, castRank, baseRank, madeOfMetal) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / aura.penalty.step.interval));
    return (madeOfMetal ? aura.penalty.metal : aura.penalty.base) + steps * aura.penalty.step.add;
}
