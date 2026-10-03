// Despair that slows by turns (Wave of Despair): "You inflict despair on creatures in the area. The effects for each creature are determined by its
// Will save." with rows "For 1 round, the creature can't use reactions and must attempt another save at the start of its turn; on a failure, it is
// @UUID[…]{Slowed 1} for that turn as it sobs uncontrollably." / "As success, but the duration is 1 minute." / "As failure, and the creature is
// automatically slowed 1 for 1 minute.": a Despair note for each row's time (no reactions — the GM's), with a save at the start of each of its turns
// whose failure grants Slowed 1 for that turn; the critical failure's Slowed 1 for 1 minute.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You inflict despair on creatures in the area\. The effects for each creature are determined by its (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^For (\d+) rounds?, the creature can't use reactions and must attempt another save at the start of its turn; on a failure, it is (@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}) for that turn as it sobs uncontrollably\.$/;
const FAILURE = /^As success, but the duration is (\d+) (minute|hour)s?\.$/;
const CRITICAL = /^As failure, and the creature is automatically ([a-z]+) (\d) for (\d+) (minute|hour)s?\.$/;

/** {html, notes, sentences} or null. */
export function rewriteDespairRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The creature is unaffected\.$/.test(plain("Critical Success")) || !success || !failure || !critical
        || critical[1] !== success[4].toLowerCase() || critical[2] !== success[5] || critical[3] !== failure[1] || critical[4] !== failure[2]) return null;
    const condition = { slug: success[4].toLowerCase(), value: Number(success[5]), uuid: success[3] };
    const note = (degree, value, unit) => ({ label: "Despair", text: `It can't use reactions. At the start of each of its turns it attempts another ${lead[1]} save; on a failure it is ${success[4]} ${success[5]} for that turn (the module grants it).`,
        sourceText: plain(degree), claimsRow: true, gmPlays: true, recurringSave: { timing: "turn-start", mode: "turn-condition", statistic: lead[1].toLowerCase(), condition, sourceText: plain(degree) },
        duration: { mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `${value} ${unit}${value === "1" ? "" : "s"}` } });
    return {
        html: `<p>Each creature in the area must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${success[2].replace(/\{[A-Z][a-z]+ (\d)\}/, `{${success[4]} $1}`)} for ${critical[3]} ${critical[4]}${critical[3] === "1" ? "" : "s"}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        notes: { success: note("Success", success[1], "round"), failure: note("Failure", failure[1], failure[2]), criticalFailure: note("Critical Failure", failure[1], failure[2]) },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
