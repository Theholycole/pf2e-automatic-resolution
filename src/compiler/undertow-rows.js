// A water area that batters and holds swimmers back (Undertow):
//   "You create an area of water 20 feet deep. The DC for Athletics checks to [[/act swim]] in the area is equal to your spell DC. A creature that
//   starts its turn in the area must attempt a Fortitude save." with rows "Success The creature takes @Damage[2d6[bludgeoning]] damage." / "Failure
//   The creature takes @Damage[4d6[bludgeoning]] damage and takes a –2 circumstance penalty to Athletics checks to Swim and a –10-foot circumstance
//   penalty to its swim Speed, if it has one, until it leaves the area." with PF2e's Effect / "Critical Failure As failure, and the creature is
//   pulled 10 feet down."
// The lingering area's rows: each row's own damage; the failing rows' PF2e Effect (proved: exactly those two penalties) until the creature leaves
// the area; the critical failure's pull down is the GM's (a note); the water's depth and Swim DC are the area's notes.
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES } from "./text-patterns.js";

const LEAD = [
    /^You create an area of water (\d+) feet deep\.$/,
    /^The DC for Athletics checks to (?:\[\[\/act swim\]\]|Swim) in the area is equal to your spell DC\.$/,
    /^A creature that starts its turn in the area must attempt an? (Fortitude|Reflex|Will) save\.$/
];
const DAMAGE = String.raw`@Damage\[(\d+d\d+)\[([a-z]+)\]\]`;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: new RegExp(String.raw`^The creature takes ${DAMAGE} damage\.$`),
    failure: new RegExp(String.raw`^The creature takes ${DAMAGE} damage and (takes a [–−-]\d (?:circumstance|status) penalty to Athletics checks to Swim and a [–−-]\d+-foot (?:circumstance|status) penalty to its swim Speed, if it has one, until it leaves the area)\.$`),
    criticalFailure: /^As failure, and the creature is pulled (\d+) feet down\.$/
};
const LINK = /<p>\s*(@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\})\s*<\/p>/;

/** {html, swimRow, notes, pullNote, claimed} or null. */
export function rewriteUndertow(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index])) || LEAD[2].exec(lead[2])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const link = LINK.exec(table);
    if (!link) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    const swimRow = `The creature ${rows.failure[3]}.`;
    return {
        html: `<p>${lead[2]}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes @Damage[${rows.success[1]}[${rows.success[2]}]] damage.</p>`
            + `<p><strong>Failure</strong> The creature takes @Damage[${rows.failure[1]}[${rows.failure[2]}]] damage. ${swimRow} ${link[1]}</p><p><strong>Critical Failure</strong> As failure.</p>`,
        swimRow,
        notes: [`The area is water ${LEAD[0].exec(lead[0])[1]} feet deep (the GM's map).`, "The DC for Athletics checks to Swim in the area is the spell DC."],
        pullNote: { label: "Pulled down", text: `It's pulled ${rows.criticalFailure[1]} feet down (the GM moves it).`, sourceText: written[3], gmPlays: true,
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 0, sourceText: "this turn" } },
        claimed: [...lead, ...written]
    };
}
