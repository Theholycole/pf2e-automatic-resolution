// A sustained light aura that burns void-healing creatures on each cast and Sustain, slows those vulnerable to sunlight, and answers fire damage
// with vitality (Palm-Held Sun; user decision 2026-10-01: a trait PF2e can't detect is the GM's choice on the card):
//   "You shed bright light in a 30-foot emanation (and dim light to the next 30 feet)." / "When you Cast or Sustain the spell, each creature
//   with void healing in the aura takes @Damage[1[vitality]|options:area-damage] damage, and any creature in the aura with a particular
//   vulnerability to sunlight becomes Slowed 1 for 1 round unless it succeeds at a Fortitude save." / "After a creature in the aura loses HP
//   due to fire damage from any source, it takes 1 vitality damage." with PF2e's Effect (the light, and an Aura).
// PF2e's Effect goes on the caster (its Aura's radius the text's 30-foot emanation, not PF2e's 60) for the sustained duration. On the cast and
// each Sustain the void-healing creatures in it take the damage, and a card lets the GM target the creatures vulnerable to sunlight for the save
// (a compiled degree save: Slowed 1 for 1 round on a failure). A creature in it that loses Hit Points to damage with fire in it takes 1 vitality.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const LIGHT = /^You shed bright light in an? (\d+)-foot emanation \(and dim light to the next (\d+) feet\)\.$/;
const PULSE = /^When you Cast or Sustain the spell, each creature with void healing in the aura takes @Damage\[(\d+)\[vitality\](?:\|options:area-damage)?\] damage, and any creature in the aura with a particular vulnerability to sunlight becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{(Slowed) (\d)\}) for (\d+) rounds? unless it succeeds at an? (Fortitude|Reflex|Will) save\.$/;
const FIRE = /^After a creature in the aura loses HP due to (fire) damage from any source, it takes (\d+) (vitality) damage\.$/;

/** {sunAura, saveHtml, claimed} or null. */
export function extractSunAura(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved" || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => LIGHT.test(sentence));
    if (at < 0 || at > 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (sentences.length !== at + 4 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(sentences[at + 3])) return null;
    const light = LIGHT.exec(sentences[at]), pulse = PULSE.exec(sentences[at + 1]), fire = FIRE.exec(sentences[at + 2]);
    if (!pulse || !fire || pulse[6].toLowerCase() !== adapted.defense.statistic) return null;
    // PF2e's Effect: its light (the text's bright and dim) and an Aura (whose radius the text's emanation replaces).
    const rules = links[0].document?.mechanics?.rules ?? [];
    const lightAt = rules.findIndex(rule => rule.key === "TokenLight" && Number(rule.value?.bright) === Number(light[1]) && Number(rule.value?.dim) === Number(light[1]) + Number(light[2]));
    const auraAt = rules.findIndex(rule => rule.key === "Aura" && /^[a-z-]+$/.test(rule.slug ?? ""));
    if (rules.length !== 2 || lightAt < 0 || auraAt < 0) return null;
    const condition = pulse[3].toLowerCase(), value = Number(pulse[4]), rounds = Number(pulse[5]);
    return {
        sunAura: { effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, radius: Number(light[1]), durationSeconds: Number(minutes[1]) * 60,
            ruleOverrides: Number(rules[auraAt].radius) === Number(light[1]) ? [] : [{ index: auraAt, key: "Aura", patch: { radius: Number(light[1]) } }],
            voidHealing: { damage: Number(pulse[1]), type: "vitality" }, sunlight: { condition, value, rounds, statistic: pulse[6].toLowerCase() },
            fire: { trigger: fire[1], damage: Number(fire[2]), type: fire[3] } },
        saveHtml: `<p>Each creature in the area must attempt a ${pulse[6]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${pulse[2]} for ${rounds} round${rounds === 1 ? "" : "s"}.</p><p><strong>Critical Failure</strong> The creature is ${pulse[2]} for ${rounds} round${rounds === 1 ? "" : "s"}.</p>`,
        claimed: sentences.slice(at, at + 3)
    };
}
