// A sustained emanation whose Effect the caster's allies hold while inside, with an Escape the caster offers on each cast and Sustain (Coiling
// Dance):
//   "Your allies in the area are filled with sacred energy, making their spells and attacks holy." / "Creatures or effects that would be unholy
//   don't gain this benefit" with PF2e's Effect (the holy trait added to spells and weapons, unless the creature or the item is unholy), and
//   "When you cast or Sustain this spell, you can choose an ally in the area that's Grabbed, Immobilized, or Restrained." / "They can
//   immediately use a reaction to Escape; they can use your Occultism or Religion modifier for the check instead of their unarmed attack,
//   Acrobatics, or Athletics modifier if that would be better."
// Casting starts a sustained lingering record centred on the caster: each ally inside (not the caster) holds PF2e's Effect, lost on leaving.
// On the cast and each Sustain a card offers the Escape: the targeted ally inside, with one of those conditions, rolls PF2e's Escape, raised to
// the caster's better skill modifier when that's higher.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, SKILLS } from "./text-patterns.js";

const HOLY = /^Your allies in the area are filled with sacred energy, making their spells and attacks (holy|unholy)\.$/;
const EXCEPT = /^Creatures or effects that would be (holy|unholy) don't gain this benefit\.?$/;
const CHOOSE = /^When you cast or Sustain this spell, you can choose an ally in the area that's @UUID\[[^\]]+\]\{(Grabbed)\}, @UUID\[[^\]]+\]\{(Immobilized)\}, or @UUID\[[^\]]+\]\{(Restrained)\}\.$/;
const ESCAPE = /^They can immediately use a reaction to (?:@UUID\[[^\]]+\]\{Escape\}|Escape); they can use your ([A-Z][a-z]+) or ([A-Z][a-z]+) modifier for the check instead of their unarmed attack, Acrobatics, or Athletics modifier if that would be better\.$/;

/** Returns {escapeAura, claimed} or null. */
export function compileEscapeAura(adapted, nativeSpellEffects) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    if (String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const paragraphs = [...String(adapted.descriptionHTML ?? "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 3 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1]) || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const split = html => htmlToPlainText(`<p>${html}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    // (PF2e's text keeps the condition links in the second paragraph: read it raw.)
    const first = split(paragraphs[0]), second = paragraphs[2].replace(/\s+/g, " ").split(/(?<=\.)\s+(?=[A-Z])/).map(sentence => sentence.trim());
    const at = first.findIndex(sentence => HOLY.test(sentence));
    if (at < 0 || at > 1 || first.length !== at + 2 || first.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const holy = HOLY.exec(first[at]), except = EXCEPT.exec(first[at + 1]);
    if (!except || except[1] === holy[1] || second.length !== 2) return null;
    const choose = CHOOSE.exec(second[0]), escape = ESCAPE.exec(second[1]);
    if (!choose || !escape) return null;
    const skills = [escape[1], escape[2]].map(skill => skill.toLowerCase());
    if (!skills.every(skill => SKILLS.includes(skill))) return null;
    // PF2e's Effect: the trait added to spells and to weapons, unless the creature or the item has the opposing trait.
    const rules = links[0].document?.mechanics?.rules ?? [];
    const predicate = JSON.stringify([{ nor: [`self:trait:${except[1]}`, `item:trait:${except[1]}`] }]);
    const alters = type => rules.some(rule => rule.key === "ItemAlteration" && rule.itemType === type && rule.mode === "add" && rule.property === "traits" && rule.value === holy[1]
        && JSON.stringify(rule.predicate) === predicate);
    if (rules.length !== 2 || !alters("spell") || !alters("weapon")) return null;
    return {
        escapeAura: { effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, radius: Number(area.value), durationSeconds: Number(minutes[1]) * 60,
            escape: { conditions: [choose[1], choose[2], choose[3]].map(name => name.toLowerCase()), skills, sourceText: `${second[0]} ${second[1]}` } },
        claimed: [...first.slice(at), ...second]
    };
}
