// Objects animated into a minion (Animated Spark): "The target becomes a semi-sentient creature with the minion trait that gains 2 actions when you Cast the Spell and when you
// Sustain the spell to give it commands. … If you Cast the Spell on another target, the spell automatically ends." / "The target has the same base statistics as a familiar
// for your level, with the exception of its abilities. It has the construct familiar ability, but doesn't require the tough pet ability. It has a weakness equal to your
// level to an appropriate damage type, usually bludgeoning, piercing, slashing, or fire … The creature has 2 pet abilities in addition to its construct ability chosen at
// the time of casting …" / "The target can disperse itself as a single action, dealing 2d4 damage in a 5-foot emanation with a basic Reflex save against your spell DC.
// This damage is bludgeoning, piercing, or slashing damage (as appropriate for the object). After it disperses itself, the objects become inanimate again and the spell
// ends. …" with "Heightened (+1) You increase the maximum Bulk of the targets by 1, and the damage increases by 1d4.": a PF2e familiar whose master is the caster (its
// statistics a familiar's for the caster's level) with the Construct ability, the weakness (the type chosen, the caster's level) and the 2 abilities chosen; a minion
// acting on the caster's commands; the caster's Effect for the sustained 10 minutes (the earlier spark ended); its disperse control — the dice in a 5-foot emanation
// (basic Reflex, the type chosen), then the spell ends; the unsustained task, the School of Unified Magical Theory and the 11th-level choice notes.
import { htmlToPlainText } from "./description-parser.js";

const CREATURE = /^The target becomes a semi-sentient creature with the minion trait that gains (\d) actions when you Cast the Spell and when you Sustain the spell to give it commands\.$/;
const STATS = /^The target has the same base statistics as a familiar for your level, with the exception of its abilities\. It has the construct familiar ability, but doesn['’]t require the tough pet ability\. It has a weakness equal to your level to an appropriate damage type, usually ([a-z]+), ([a-z]+), ([a-z]+), or ([a-z]+) unless there would be a more appropriate damage type \(subject to GM discretion\)\. The creature has (\d) pet abilities in addition to its construct ability chosen at the time of casting and the target must meet any prerequisites for the ability selection\.$/;
const DISPERSE = /^The target can disperse itself as a single action, dealing (\d+)d(\d+) damage in a (\d+)-foot emanation with a basic (Fortitude|Reflex|Will) save against your spell DC\. This damage is ([a-z]+), ([a-z]+), or ([a-z]+) damage \(as appropriate for the object\)\. After it disperses itself, the objects become inanimate again and the spell ends\. (If you choose not to Sustain the spell, the spell does not automatically end so long as the last command you gave the target could be repeated exactly, gaining a single action to complete its task at the end of each of your turns\. If the target cannot reasonably perform the last task you gave it \(subject to GM discretion\), it spends a single action to disperse itself instead\.)$/;
const STEP = /^Heightened \(\+1\) You increase the maximum Bulk of the targets by (\d), and the damage increases by 1d(\d+)\.$/;

/** {spark, sentences} or null. */
export function extractAnimatedSpark(item) {
    if (!item?.system?.duration?.sustained && !/sustained/.test(String(item?.system?.duration?.value ?? ""))) return null;
    const sections = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (sections.length !== 3) return null;
    const paragraphs = [...sections[0].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim().replace(/’/g, "'"));
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const creature = CREATURE.exec(lead[1] ?? ""), stats = STATS.exec(paragraphs[1] ?? ""), disperse = DISPERSE.exec(paragraphs[3] ?? "");
    const step = STEP.exec(htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 5 || !creature || !/^The target objects must not be magical, consumable, or otherwise complex \(subject to GM discretion\)\.$/.test(lead[2] ?? "")
        || !/^If you Cast the Spell on another target, the spell automatically ends\.$/.test(lead[3] ?? "") || !stats || !disperse || !step || step[2] !== disperse[2]) return null;
    const special = htmlToPlainText(sections[2]).replace(/\s+/g, " ").trim();
    return {
        spark: { actions: Number(creature[1]), weaknessTypes: [stats[1], stats[2], stats[3], stats[4]], abilities: Number(stats[5]), constructUuid: "Compendium.pf2e.familiar-abilities.Item.5eqcXtPsYunphMOZ",
            disperse: { dice: Number(disperse[1]), die: Number(disperse[2]), radius: Number(disperse[3]), statistic: disperse[4].toLowerCase(), types: [disperse[5], disperse[6], disperse[7]], step: 1 },
            baseRank: 1, seconds: 600, notes: [disperse[8], paragraphs[4], special] },
        sentences: [lead[1], lead[2], lead[3], paragraphs[1], paragraphs[3], htmlToPlainText(sections[1]).trim()]
    };
}
