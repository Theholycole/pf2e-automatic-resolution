// Wisps that each strike a creature the caster damages with a Strike (Flame Wisp; user decision 2026-10-01: Effect + note spells count once the
// module covers what PF2e's Effect doesn't, and what it can't detect is a GM control):
//   "Three faintly glowing wisps of fire float around your head, …" / "After you deal damage to a creature with a Strike, one of the wisps goes
//   hurtling toward that creature, destroying the wisp and dealing 1d4 fire damage." / "If you Cast a Spell with the fire trait while you have
//   fewer than three wisps, a new wisp appears." / "Heightened (+2) The damage increases by 1d4."
// PF2e's Effect adds the dice to every Strike, which the text doesn't (each wisp is spent): the module removes that rule (the text over the
// data) and counts the wisps; its controls send a wisp at the targeted creature (the dice at the cast rank) and add one for a fire spell.
import { htmlToPlainText } from "./description-parser.js";

const WORDS = { two: 2, three: 3, four: 4, five: 5 };
const FLOAT = /^(Two|Three|Four|Five) faintly glowing wisps of ([a-z]+) float around your head, dancing along to your movements\.$/;
const STRIKE = /^After you deal damage to a creature with a Strike, one of the wisps goes hurtling toward that creature, destroying the wisp and dealing (\d+)d(\d+) ([a-z]+) damage\.$/;
const REGROW = /^If you Cast a Spell with the ([a-z]+) trait while you have fewer than (two|three|four|five) wisps, a new wisp appears\.$/;

/** Returns {wisps, claimed} or null. */
export function compileWisps(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const fixed = /^(\d+) (round|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])].filter(effect => effect.resolutionStatus === "resolved");
    if (links.length !== 1) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body.replace(/@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/g, "")).replace(/\s+/g, " ").trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 3) return null;
    const float = FLOAT.exec(sentences[0]), strike = STRIKE.exec(sentences[1]), regrow = REGROW.exec(sentences[2]);
    if (!float || !strike || !regrow || WORDS[regrow[2]] !== WORDS[float[1].toLowerCase()] || strike[3] !== float[2] || regrow[1] !== float[2]) return null;
    let step = null;
    if (rest.length) {
        const heightened = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>/.exec(rest[0]);
        if (!heightened || heightened[3] !== strike[2]) return null;
        step = { interval: Number(heightened[1]), dice: Number(heightened[2]) };
    }
    // PF2e's Effect: only the per-Strike dice the text replaces (removed when applied).
    const rules = links[0].document?.mechanics?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "DamageDice" || rules[0].damageType !== strike[3] || rules[0].dieSize !== `d${strike[2]}`) return null;
    return {
        wisps: { count: WORDS[float[1].toLowerCase()], dice: Number(strike[1]), die: Number(strike[2]), type: strike[3], trait: regrow[1], heightening: step, baseRank: Number(adapted.rank),
            durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60), effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference },
            ruleOverrides: [{ index: 0, key: "DamageDice", remove: true }] },
        claimed: sentences
    };
}
