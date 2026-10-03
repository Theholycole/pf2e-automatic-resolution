// Serrated limbs in the area (Sawtooth Terrain): "You cause long, serrated mantis limbs to appear, swiping at and obstructing creatures in the area. The
// area is difficult terrain. Each creature in the area when the spell is cast and who end their turn within the area take 3d6 slashing damage and
// @Damage[(floor((@item.level -1)/2)d6)[bleed]] damage, as determined by its Reflex save." with rows "… half damage and no persistent damage." / "… full
// damage and a –10-foot circumstance penalty to their Speed until they receive magical healing or benefit from a successful Medicine check against your
// spell DC to Administer First Aid." / "… double damage and a –15-foot circumstance penalty …": the lingering area's terrain and saves (in it at the
// cast, or ending a turn in it); the rows' slashing (PF2e's entry) and bleed (the text's, doubled on a critical failure); the Speed penalty a note
// with PF2e's modifier, lasting until the GM ends it (magical healing or a successful Administer First Aid against the spell DC).
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You cause [^.]+ to appear, swiping at and obstructing creatures in the area\. The area is difficult terrain\. Each creature in the area when the spell is cast and who end their turn within the area take (\d+d\d+) ([a-z]+) damage and @Damage\[\(floor\(\(@item\.level -(\d)\)\/(\d)\)d(\d+)\)\[bleed\]\] damage, as determined by its (Fortitude|Reflex|Will) save\.$/;
const SLOWED = /^The creature takes (full|double) damage and a [–−-](\d+)-foot (circumstance|status) penalty to their Speed until they receive magical healing or benefit from a successful Medicine check against your spell DC to (?:@UUID\[[^\]]+\]\{Administer First Aid\}|administer First Aid|Administer First Aid)\.$/;

/** {html, notes, sentences} or null. */
export function rewriteSawtoothRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst") return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = SLOWED.exec(plain("Failure")), critical = SLOWED.exec(plain("Critical Failure"));
    if (!lead || lead[6].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The creature is unaffected."
        || plain("Success") !== "The creature takes half damage and no persistent damage." || !failure || !critical || failure[1] !== "full" || critical[1] !== "double") return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== lead[1] || String(components[0].type).toLowerCase() !== lead[2]) return null;
    // (The bleed rises 1d6 every 2 ranks, as "Heightened (+2) … the persistent bleed damage increases by 1d6" says.)
    if (!/^Heightened \(\+(\d)\) The damage increases by \d+d\d+, and the persistent bleed damage increases by 1d(\d+)\.$/.test(htmlToPlainText(heightened).replace(/\s+/g, " ").trim())) return null;
    const bleed = `(floor((@item.level -${lead[3]})/${lead[4]}))d${lead[5]}`;
    const note = (heading, match) => ({ label: "Sawtooth wounds", text: `A –${match[2]}-foot ${match[3]} penalty to its Speed until it receives magical healing or someone succeeds at Administer First Aid on it against the spell DC (the GM ends this then).`,
        sourceText: plain(heading), claimsRow: true, gmPlays: true, rules: [{ key: "FlatModifier", selector: "land-speed", type: match[3], value: -Number(match[2]) }], duration: { mode: "unlimited", sourceText: "unlimited" } });
    return {
        html: `<p>A creature in the area when you Cast the Spell, or that ends its turn in the area, must attempt a ${lead[6]} save. The area is difficult terrain.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and @Damage[${bleed}[persistent,bleed]] damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage and @Damage[(2*(${bleed}))[persistent,bleed]] damage.</p>${heightened ? `<hr />${heightened}` : ""}`,
        notes: { failure: note("Failure", failure), criticalFailure: note("Critical Failure", critical) },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
