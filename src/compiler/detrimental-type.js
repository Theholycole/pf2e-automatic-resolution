// Damage of whichever type hurts the creature more (Divine Immolation): "Creatures take 6d6 fire damage and @Damage[(@item.level -3)d6[persistent,
// fire]] damage." / "The divine power within the flames scorches the spirit as well; a creature takes spirit damage instead of fire damage from
// divine immolation if that would be more detrimental to the creature (as determined by the GM)." with rows "The creature takes half damage and no
// persistent damage." / "… full damage and persistent damage." / "… double damage and double persistent damage.": the rows with the persistent
// formula written out (doubled on a critical failure), and the type swapped for each creature that PF2e's immunities, weaknesses and resistances
// make the second type worse for (its persistent part too).
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES, NARRATION_RULES } from "./text-patterns.js";

const TAKES = /^Creatures take (\d+d\d+) ([a-z]+) damage and @Damage\[\(@item\.level -(\d)\)d(\d+)\[persistent,([a-z]+)\]\] damage\.$/;
const INSTEAD = /^The [a-z ]+ scorches the spirit as well; a creature takes ([a-z]+) damage instead of ([a-z]+) damage from [a-z ]+ if that would be more detrimental to the creature \(as determined by the GM\)\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: /^The creature takes half damage and no persistent damage\.$/,
    failure: /^The creature takes full damage and persistent damage\.$/,
    criticalFailure: /^The creature takes double damage and double persistent damage\.$/
};
const STEP = /^Heightened \(\+1\) The damage increases by 1d(\d+) and persistent damage increases by 1d(\d+)\.$/;

/** {html, damageSwap, sentences} or null. */
export function rewriteDetrimentalType(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0])) return null;
    const takes = TAKES.exec(sentences[1]), instead = INSTEAD.exec(sentences[2]);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!takes || !instead || !step) return null;
    const [, formula, type, offset, faces, persistentType] = takes;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || persistentType !== type || instead[2] !== type || instead[1] === type || step[2] !== faces || Number(adapted.rank) - Number(offset) < 1) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const written = [];
    for (const [degree, heading] of DEGREES) {
        const text = paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "";
        if (!ROWS[degree].test(htmlToPlainText(text).trim())) return null;
        written.push(`${heading} ${htmlToPlainText(text).trim()}`);
    }
    if (paragraphs.length !== 4) return null;
    const persistent = `(@item.level -${offset})d${faces}`;
    return {
        html: `<p>${sentences[0]} Creatures take ${formula} ${type} damage and @Damage[${persistent}[persistent,${type}]] damage.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and @Damage[${persistent}[persistent,${type}]] damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and @Damage[(2*(${persistent}))[persistent,${type}]] damage.</p>${heightened ? `<hr />${heightened}` : ""}`,
        damageSwap: { from: type, to: instead[1], when: "more-detrimental", sourceText: sentences[2] },
        sentences: [...sentences.slice(1), ...written]
    };
}
