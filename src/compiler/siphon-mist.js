// A sustained cloud whose Sustain feeds the caster (Sanguine Mist): "You create a cloud of bloodsucking fog that drains the life from the
// living." / "Each living creature in the area when you Cast the Spell, aside from you, takes @Damage[6d6[void]] damage with a basic Fortitude
// save." / "Creatures in the area are @UUID[…]{Concealed}, and all creatures outside the cloud become concealed to creatures within it." /
// "The first time each round you Sustain this spell on subsequent turns, living creatures in the area take an additional
// @Damage[(@item.rank -2)d6[void]] damage with another basic Fortitude save." / "You also gain temporary Hit Points equal to half the damage a
// single creature took when you Sustained the spell this turn; calculate these temporary Hit Points using the creature that took the most
// damage." / "These temporary Hit Points last for 1 minute." with "Heightened (+1) The initial damage increases by 2d6 and the secondary damage
// increases by 1d6.": the lingering area's cast and Sustain exposures (living creatures, not the caster), its concealment, and the caster's
// temporary Hit Points from each Sustain's exposures (the most any one creature lost, halved; the higher amount kept).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const CAST = /^Each living creature in the area when you Cast the Spell, aside from you, takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage with a basic (Fortitude|Reflex|Will) save\.$/;
const CONCEALED = /^Creatures in the area are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}, and all creatures outside the cloud become concealed to creatures within it\.$/;
const SUSTAIN = /^The first time each round you Sustain this spell on subsequent turns, living creatures in the area take an additional @Damage\[\(@item\.rank -(\d)\)d(\d+)\[([a-z]+)\]\] damage with another basic (Fortitude|Reflex|Will) save\.$/;
const SIPHON = /^You also gain temporary Hit Points equal to half the damage a single creature took when you Sustained the spell this turn; calculate these temporary Hit Points using the creature that took the most damage\.$/;
const LASTS = /^These temporary Hit Points last for (\d+) minutes?\.$/;
const STEP = /^Heightened \(\+1\) The initial damage increases by (\d+d\d+) and the secondary damage increases by 1d(\d+)\.$/;

/** {html, siphon, sentences} or null. */
export function rewriteSiphonMist(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 6 || NARRATION_RULES.test(sentences[0])) return null;
    const cast = CAST.exec(sentences[1]), sustain = SUSTAIN.exec(sentences[3]), lasts = LASTS.exec(sentences[5]);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!cast || !CONCEALED.test(sentences[2]) || !sustain || !SIPHON.test(sentences[4]) || !lasts || !step) return null;
    const [, formula, type, statistic] = cast;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || sustain[4] !== statistic || sustain[3] !== type || step[2] !== sustain[2]
        // (The secondary dice are (rank − N)d: 1 more each rank, as the step says; the initial step is PF2e's item's.)
        || Number(adapted.rank) - Number(sustain[1]) < 1) return null;
    return {
        html: `<p>This fog deals ${formula} ${type} damage with a basic ${statistic} save to each creature in the area. All creatures within the cloud become concealed, and all creatures outside the cloud become concealed to creatures within it. `
            + `On subsequent rounds, the first time each round you Sustain this Spell, it deals @Damage[(@item.rank -${sustain[1]})d${sustain[2]}[${type}]] damage with a basic ${statistic} save to each creature in the area.</p>${heightened ? `<hr />${heightened}` : ""}`,
        siphon: { fraction: 0.5, measure: "most-lost", lasts: { value: Number(lasts[1]), unit: "minutes" }, sourceText: [sentences[4], sentences[5]].join(" ") },
        sentences
    };
}
