// Air a creature must strain to breathe each turn (Stifling Stillness): "You make all air in the target area unnaturally still and
// unyielding, creating a shimmering haze." / "The stagnant, heavy air becomes an area of difficult terrain." / "Creatures in the area that
// breathe air and aren't holding their breath must spend a single action on their turn straining to breathe the stagnant air; once they do,
// they still mostly breathe their own exhaled air, taking 3d6 poison damage (basic Fortitude save) and becoming @UUID[…]{Fatigued}.": the
// lingering area exposes each creature as its turn starts (it spends that action on its turn); the save's rows are the basic save's, each
// with the condition, which follows whatever the result. Who breathes and holds its breath is the GM's at review.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const TERRAIN = /^The [a-z, ]+ air becomes an area of difficult terrain\.$/;
const STRAIN = new RegExp(String.raw`^Creatures in the area that breathe air and aren't holding their breath must spend a single action on their turn straining to breathe the [a-z ]+ air; once they do, they [a-z ]+, taking (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\) and becoming (${C}[A-Z][a-z]+\})\.$`);

/** {html, notes, claimed} or null. */
export function rewriteStiflingAir(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened = "", ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    // (The heightening paragraph is PF2e's step on the item's one damage entry.)
    if (rest.length || (heightened && !/^<p>\s*<strong>\s*Heightened \(\+\d\)\s*<\/strong>\s*The damage increases by \d+d\d+\.\s*<\/p>$/.test(heightened))) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !TERRAIN.test(sentences[1])) return null;
    const strain = STRAIN.exec(sentences[2]);
    if (!strain || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== strain[1]
        || String(components[0].type).toLowerCase() !== strain[2] || strain[3].toLowerCase() !== adapted.defense.statistic) return null;
    const condition = strain[4];
    return {
        html: `<p>All surfaces in the area are difficult terrain. Each creature that starts its turn in the area must attempt a ${strain[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is ${condition}.</p><p><strong>Success</strong> The creature takes half damage and is ${condition}.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is ${condition}.</p><p><strong>Critical Failure</strong> The creature takes double damage and is ${condition}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        notes: ["A creature in the area must spend a single action on its turn straining to breathe; the save is for that action.",
            "Only creatures that breathe air and aren't holding their breath are affected: leave the others out when you review the exposures."],
        claimed: sentences
    };
}
