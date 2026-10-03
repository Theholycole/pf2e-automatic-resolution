// A spell whose caster picks one of two thoughts for one or two creatures (Contagious Idea):
//   "You place either a pleasant thought or a terrifying one in a creature's mind. You can then plant the same thought in a second creature's
//   mind. You can't choose a creature that's already been a target of this casting of contagious idea, nor can you choose yourself. The second
//   target can be beyond the range of the spell, but it must be within 30 feet of the first target." with "Pleasant Thought: … gaining 5
//   temporary Hit Points that last for 1 minute. @UUID[…]{Spell Effect: …}" and "Terrifying Thought: … The target must attempt a Will save."
//   with a degree table, and "Heightened (+1) The temporary Hit Points for a pleasant thought increase by 1."
// Casting asks for the thought. Pleasant: PF2e's Effect on each target, its TempHP set to the text's 5 + 1 per rank (user decision; PF2e's is the rank).
// Terrifying: the degree table is compiled as its own save plan (the module's save card for the targets). The targets are checked: one or two,
// never the caster, the first within the range and the second within the stated distance of the first.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [
    /^You place either a ([a-z]+) thought or a ([a-z]+) one in a creature's mind\.$/,
    /^You can then plant the same thought in a second creature's mind\.$/,
    /^You can't choose a creature that's already been a target of this casting of [a-z ]+, nor can you choose yourself\.$/,
    /^The second target can be beyond the range of the spell, but it must be within (\d+) feet of the first target\.$/
];
const PLEASANT = /^<li>\s*<strong>\s*([A-Z][a-z]+) Thought\s*<\/strong>\s*The target is soothed by a [a-z ]+, gaining (\d+) temporary Hit Points that last for (\d+) minutes?\.\s*(@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\})\s*<\/li>/;
const TERRIFYING = /<li>\s*<p>\s*<strong>\s*([A-Z][a-z]+) Thought\s*<\/strong>\s*([\s\S]*?)<\/p>\s*(<ul>[\s\S]*?<\/ul>)\s*<\/li>\s*<\/ul>\s*$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The temporary Hit Points for a ([a-z]+) thought increase by (\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?)\b/i;

/** Returns {branchHTML, thoughtChoice, claimed} or null; the caller compiles `branchHTML` as the second thought's save. */
export function extractThoughtChoice(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.lifecycle?.duration ?? "").trim()) return null;
    if (!/^1 or 2 creatures other than yourself \(see text\)$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const range = /^(\d+) feet \(see text\)$/i.exec(String(adapted.targeting?.range ?? adapted.range ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 2) return null;
    const heightened = HEIGHTENED.exec(sections[1]);
    const lead = /^<p>([\s\S]*?)<\/p>\s*<ul>([\s\S]*)$/.exec(sections[0]);
    if (!heightened || !lead) return null;
    const sentences = htmlToPlainText(`<p>${lead[1]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => LEAD[0].test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + LEAD.length || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (LEAD.some((pattern, index) => !pattern.test(sentences[at + index]))) return null;
    const [, first, second] = LEAD[0].exec(sentences[at]);
    const secondFeet = Number(LEAD[3].exec(sentences[at + 3])[1]);
    const pleasant = PLEASANT.exec(lead[2].trim());
    const terrifying = TERRIFYING.exec(lead[2]);
    if (!pleasant || !terrifying || pleasant[1].toLowerCase() !== first || terrifying[1].toLowerCase() !== second || heightened[1] !== first) return null;
    // The terrifying thought: its lead (narration, then the save) and its degree table, compiled as their own save.
    const terrifyingLead = htmlToPlainText(`<p>${terrifying[2]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const save = /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/.exec(terrifyingLead.at(-1) ?? "");
    if (!save || terrifyingLead.length > 2 || terrifyingLead.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    // PF2e's Effect: only the temporary Hit Points.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    if (rules.length !== 1 || rules[0].key !== "TempHP" || !/@item\.(?:level|rank)/.test(String(rules[0].value))) return null;
    if (!links[0].raw?.includes?.(pleasant[4]) && !pleasant[4].includes(links[0].label ?? "\u0000")) return null;
    const textHP = Number(pleasant[2]), step = Number(heightened[2]);
    return {
        branchHTML: `<p>${terrifying[2].trim()}</p>${terrifying[3]}`,
        saveStatistic: save[1].toLowerCase(),
        thoughtChoice: {
            modes: [first, second], rangeFeet: range ? Number(range[1]) : null, secondFeet, maxTargets: 2,
            // The text's amount (PF2e's Effect gives the rank instead): its TempHP rule is set to the text's value at the cast rank.
            pleasant: { effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, textTempHP: textHP, step, minutes: Number(pleasant[3]), ruleIndex: 0 }
        },
        claimed: [...sentences, htmlToPlainText(pleasant[0]).trim(), ...terrifyingLead, htmlToPlainText(sections[1]).trim()]
    };
}

/** The targets' rule: one or two, never the caster, distinct, the first within range and the second near the first. */
export function checkThoughtTargets(distances, { rangeFeet, secondFeet }) {
    const { count, selfIncluded, firstFromCaster, secondFromFirst } = distances;
    if (count < 1 || count > 2) return "target 1 or 2 creatures";
    if (selfIncluded) return "you can't choose yourself";
    if (rangeFeet != null && firstFromCaster > rangeFeet) return `the first target must be within ${rangeFeet} feet`;
    if (count === 2 && secondFromFirst > secondFeet) return `the second target must be within ${secondFeet} feet of the first`;
    return null;
}

/** The pleasant thought's temporary Hit Points at a cast rank (the text: the base, plus the step per rank above the spell's). */
export function thoughtTempHP(pleasant, castRank, baseRank = 1) {
    return pleasant.textTempHP + Math.max(0, Number(castRank) - Number(baseRank)) * pleasant.step;
}
