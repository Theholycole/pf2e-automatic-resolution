// Stone reshaped under creatures (Shape Stone): "You shape the stone into a rough shape of your choice. … Any creatures standing atop the stone when you
// reshape it must each attempt a Reflex save or Acrobatics check." with rows "The creature is unaffected." / "The creature falls Prone atop the stone." /
// "The creature falls off the stone (if applicable) and lands Prone.": the creatures atop the stone (the GM's targets) roll the better of their Reflex
// save and Acrobatics check; Prone on a failure or critical failure; falling off the GM's (a reminder).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^You shape the stone into a rough shape of your choice\. (The shaping process is too crude to produce intricate parts, fine details, moving pieces, or the like\.) (Any creatures standing atop the stone when you reshape it must each attempt a (Fortitude|Reflex|Will) save or (Acrobatics|Athletics) check\.)$/;
const FAILURE = new RegExp(String.raw`^The creature falls (${C}Prone\}) atop the stone\.$`);
const CRITICAL = /^The creature falls off the stone \(if applicable\) and lands Prone\.$/;

/** {html, choice, reminder, constraint, sentences} or null. */
export function rewriteStoneReshape(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^cube of stone \d+ feet across or smaller$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const failure = FAILURE.exec(row("Failure"));
    if (!lead || lead[3].toLowerCase() !== adapted.defense.statistic || rows.length !== 3 || htmlToPlainText(row("Success")).trim() !== "The creature is unaffected." || !failure
        || !CRITICAL.test(htmlToPlainText(row("Critical Failure")).trim())) return null;
    return {
        html: `<p>Each creature atop the stone must attempt a ${lead[3]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${failure[1]}.</p><p><strong>Critical Failure</strong> The creature is ${failure[1]}.</p>`,
        choice: { statistics: [lead[3].toLowerCase(), lead[4].toLowerCase()], chooser: "target", sourceText: lead[2] },
        reminder: { kind: "spell-note", text: `Target the creatures standing atop the stone. The caster shapes it (${lead[1].replace(/\.$/, "").replace(/^The/, "the")}). On a critical failure a creature falls off the stone where it can (move it; it lands Prone).`,
            sourceText: lead[0] },
        constraint: { sourceText: "creatures standing atop the stone", supportsActorTargets: true, complete: true, predicates: [] },
        sentences: [lead[0], ...["Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading)).trim()}`)]
    };
}
