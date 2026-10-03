// Spirits that strike or shield each target (Call the Ten): "… An indistinct spirit appears near each target, … The spirits then either strike their
// designated targets with magical energy, dealing each one 4d6 spirit damage with a basic Fortitude save, or shield them, granting their target resistance
// 3 to physical and spirit damage until the beginning of your next turn. You designate which targets are attacked and which are shielded." with PF2e's
// Spell Effect and "Heightened (+2) The amount of damage increases by 1d6 and the amount of resistance increases by 2.": the targets' basic save; for each
// target the caster's answer on the card — shielded: no save, PF2e's Effect (its resistance heightened); attacked: it saves.
import { htmlToPlainText } from "./description-parser.js";

// (The spirits' arrival names "each target": narration here.)
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|until|terrain)\b/i;
const EITHER = /^The spirits then either strike their designated targets with magical energy, dealing each one (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save, or shield them, granting their target resistance (\d+) to ([a-z]+) and ([a-z]+) damage until the beginning of your next turn\.$/;
const DESIGNATE = /^You designate which targets are attacked and which are shielded\.$/;
const LINK = /^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/;
const STEP = /^Heightened \(\+(\d)\) The amount of damage increases by (\d+d\d+) and the amount of resistance increases by (\d+)\.$/;

/** {html, bolster(links), sentences} or null: the Effect's link stays in the text; `bolster` takes the spell's resolved unscoped / on-use links. */
export function rewriteSpiritChoice(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?}])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => EITHER.test(sentence));
    const either = EITHER.exec(sentences[at] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (at < 1 || !either || !DESIGNATE.test(sentences[at + 1] ?? "") || !LINK.test(sentences[at + 2] ?? "") || sentences.length !== at + 3 || !step
        || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, formula, type, statistic, value, typeA, typeB] = either;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const claim = { kind: "resistance", types: [typeA, typeB], value: Number(value), step: { interval: Number(step[1]), add: Number(step[3]), baseRank: Number(adapted.rank) || 1 },
        duration: { value: 1, unit: "rounds" } };
    return {
        html: `<p>${sentences.slice(0, at).join(" ")} The spirits strike the targets you designate, dealing each one ${formula} ${type} damage with a basic ${statistic} save.</p>`
            + `<p>${sentences[at + 2]}</p>${heightened ? `<hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>` : ""}`,
        bolster: links => links.length !== 1 || links[0].resolutionStatus !== "resolved" ? null : { question: `Did you designate this target to be shielded? If so, it doesn't save: it gains ${links[0].label ?? "the spell's Effect"} (resistance ${value} to ${typeA} and ${typeB}, +${step[3]} every ${step[1]} ranks).`,
            uuid: links[0].uuid, label: links[0].label ?? null, document: links[0].document, claim, sourceText: sentences[at] },
        link: sentences[at + 2],
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
