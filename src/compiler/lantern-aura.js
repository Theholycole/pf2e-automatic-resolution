// An emanation whose save each creature makes once, its outcome holding while it's inside (Reaper's Lantern; user decision 2026-10-01: the
// module halves the healing):
//   "It sheds bright light in the spell's area and dim light to twice that area." / "Living creatures and undead in the area when you Cast the
//   Spell, or that enter the area later, must attempt Fortitude saves." / "Living creatures that fail their Fortitude saves gain only half the
//   normal benefit from healing effects while within the area." / "Undead targets that fail their Fortitude saves become Enfeebled 1 while within
//   the area." / "Once a creature attempts a save against reaper's lantern, it uses the same outcome if it leaves the area and enters it again."
//   / "Once per turn, starting on the round after you cast reaper's lantern, you can Sustain the spell to increase the emanation's radius by 5
//   feet." / "When you do so, you force creatures in the area that haven't yet attempted a save against reaper's lantern to attempt one."
// Casting starts a lingering record centred on the caster (its light on the caster's token). Each living or undead creature inside that hasn't
// saved gets a card whose button rolls its save against the spell DC; the outcome is kept for the cast. While inside, a failed living creature
// holds an Effect that halves the healing it gets, and a failed undead one Enfeebled 1; leaving removes them, re-entering restores them. An
// optional Sustain (once a round, from the next) grows the radius and its light.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const LIGHT = /^It sheds bright light in the spell's area and dim light to twice that area\.$/;
const FLOATS = /^The [a-z]+ is insubstantial and floats near you, suspended from an? [a-z, ]+\.$/;
const WHO = /^Living creatures and undead in the area when you Cast the Spell, or that enter the area later, must attempt (Fortitude|Reflex|Will) saves\.$/;
const LIVING = /^Living creatures that fail their (Fortitude|Reflex|Will) saves gain only half the normal benefit from healing effects while within the area\.$/;
const UNDEAD = /^Undead targets that fail their (Fortitude|Reflex|Will) saves become (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{(Enfeebled|Clumsy|Drained|Stupefied|Sickened) (\d)\}) while within the area\.$/;
const SAME = /^Once a creature attempts a save against [a-z' ]+, it uses the same outcome if it leaves the area and enters it again\.$/;
const GROW = /^Once per turn, starting on the round after you cast [a-z' ]+, you can Sustain the spell to increase the emanation's radius by (\d+) feet\.$/;
const FORCE = /^When you do so, you force creatures in the area that haven't yet attempted a save against [a-z' ]+ to attempt one\.$/;

/** Returns {lanternAura, claimed} or null. */
export function compileLanternAura(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || area?.type !== "emanation" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => LIGHT.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 8 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [floats, who, living, undead, same, grow, force] = [FLOATS, WHO, LIVING, UNDEAD, SAME, GROW, FORCE].map((pattern, index) => pattern.exec(sentences[at + 1 + index]));
    if (!floats || !who || !living || !undead || !same || !grow || !force) return null;
    const statistic = who[1].toLowerCase();
    if (statistic !== adapted.defense.statistic || living[1].toLowerCase() !== statistic || undead[1].toLowerCase() !== statistic) return null;
    return {
        lanternAura: { radius: Number(area.value), durationSeconds: Number(minutes[1]) * 60, statistic, light: { brightTimes: 1, dimTimes: 2 },
            failed: { living: { halfHealing: true }, undead: { condition: undead[3].toLowerCase(), value: Number(undead[4]), link: undead[2] } },
            growth: { feet: Number(grow[1]) }, sourceText: sentences.slice(at) },
        claimed: sentences.slice(at)
    };
}
