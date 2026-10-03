// A target drawn toward an image only it can see (Vision of Beauty): "You create a phantasmal image of the most beautiful creature imaginable to the
// target at a location somewhere within the spell's range. Only the spell's target can see the beauty, though you can see the vague shape of the
// illusion as it manifests. The effect of the vision is based on the outcome of the target's Will save." with rows "The target is intrigued by the
// vision, becoming @UUID[…]{Stupefied 1} for 1 round." / "The target is entranced by the vision, becoming stupefied 1 for 1 round and moving toward
// the image's location via the most direct route possible for 1 round, bypassing any obvious hazards and enemies in the way. The target is then
// @UUID[…]{Fascinated} by the illusion for 1 round." / "As failure, except the target is @UUID[…]{Stupefied 2} and becomes fascinated by the
// illusion for 1 minute instead of 1 round.": the rows' Stupefied, Fascinated from the cast for the moving round and its own time after (2 rounds;
// 1 minute on a critical failure), and the movement a note for its round.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^You create a phantasmal image of [^.]+ at a location somewhere within the spell's range\. Only the spell's target can see [^.]+\. The effect of the vision is based on the outcome of the target's (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^The target is intrigued by the vision, becoming (${C}Stupefied (\d)\}) for 1 round\.$`);
const FAILURE = new RegExp(String.raw`^The target is entranced by the vision, becoming stupefied (\d) for 1 round and (moving toward the image's location via the most direct route possible) for 1 round, (bypassing any obvious hazards and enemies in the way)\. The target is then (${C}Fascinated\}) by the illusion for 1 round\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, except the target is (${C}Stupefied (\d)\}) and becomes fascinated by the illusion for 1 minute instead of 1 round\.$`);

/** {html, movement, sentences} or null. */
export function rewriteEntrancedRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success")))
        || !success || !failure || !critical || failure[1] !== success[2]) return null;
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is ${success[1]} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target is ${success[1]} for 1 round and ${failure[4]} for 2 rounds.</p>`
            + `<p><strong>Critical Failure</strong> The target is ${critical[1]} for 1 round and ${failure[4]} for 1 minute.</p>${heightened ? `<hr />${heightened}` : ""}`,
        movement: { label: "Entranced", text: `On its next turn, the creature spends its movement ${failure[2]} the caster placed (only it can see the image), ${failure[3]}.`,
            sourceText: htmlToPlainText(row("Failure")), gmPlays: true, duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "1 round" } },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
