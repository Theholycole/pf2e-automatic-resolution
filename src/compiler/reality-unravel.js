// A rift that tears at creatures from other planes harder (Unravel Existence): "When you Cast this Spell and the first time you Sustain it on
// subsequent rounds, each creature in the area takes 5d10 force damage with a basic Fortitude save." / "On a failed save, a creature that isn't a
// native inhabitant of the plane also takes @Damage[floor((@item.rank -3)/2)d10[persistent,force]] damage and becomes @UUID[…]{Off-Guard} until
// it recovers from this persistent damage." / "A target reduced to 0 Hit Points by either damage scatters into fine dust; its gear remains.":
// the sustained area's save at the cast and on each Sustain, as rows; the failing rows' persistent damage and Off-Guard (ending with it) only
// for a creature the GM says isn't native to the plane; the dust a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES } from "./text-patterns.js";

const LEAD = /^When you Cast this Spell and the first time you Sustain it on subsequent rounds, each creature in the area takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const RIDER = new RegExp(String.raw`^On a failed save, a creature that isn't a native inhabitant of the plane also takes (@Damage\[[^\]]*\[persistent,([a-z]+)\]\]) damage and becomes (${C}Off-Guard\}) until it recovers from this persistent damage\.$`);
const DUST = /^A target reduced to 0 Hit Points by either damage scatters into fine dust; its gear remains\.$/;

/** {html, question, reminder, sentences} or null. */
export function rewriteRealityUnravel(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0])) return null;
    const lead = LEAD.exec(sentences[1]), rider = RIDER.exec(sentences[2]);
    if (!lead || !rider || !DUST.test(sentences[3])) return null;
    const [, formula, type, statistic] = lead;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || rider[2] !== type) return null;
    // (The persistent damage isn't doubled on a critical failure: "also takes" adds it to the row's damage.)
    // (Foundry's roll parser needs a function's dice count in parentheses: "(floor((@item.rank -3)/2))d10".)
    const persistent = rider[1].replace(/^@Damage\[(floor\([^\[\]]+\))d(\d+)\[/, "@Damage[($1)d$2[");
    const extra = `${persistent} damage and is ${rider[3]} as long as it takes this persistent damage`;
    return {
        html: `<p>${sentences[0]} When you Cast this Spell and the first time you Sustain it on subsequent rounds, each creature in the area takes ${formula} ${type} damage and must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and ${extra}.</p><p><strong>Critical Failure</strong> The creature takes double damage and ${extra}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        question: "Is this creature from another plane (not a native inhabitant of this one)? If so, it also takes the persistent damage and is Off-Guard until it recovers.",
        persistentType: rider[2],
        reminder: { kind: "spell-note", text: sentences[3], sourceText: sentences[3] },
        sentences
    };
}
