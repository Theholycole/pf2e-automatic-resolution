// Allies turned suspect (Pack Breaker): "You can deceive creatures by changing their perception of their allies' behavior. Each affected creature suspects
// their allies have changed allegiance, depending on the outcome of their Will save. Regardless of the effects of the saving throw, the creature is then
// temporarily immune to pack breaker for 1 hour." with rows "The creature becomes Unfriendly to all creatures to which it wasn't already hostile, even those
// that were previously allies. It treats no one as an ally for 1 minute. Each of its former allies within its reach must attempt a save against pack
// breaker." / "As success, but the creature is also Confused for 1 round." / "As success, but the creature is confused for 1 minute.": every result
// immune for the hour; PF2e's Unfriendly (a note granting it) and "no allies" for the minute; the failing rows' Confused; and a card per affected creature
// starting the same save for its former allies within reach (the GM targets them).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C } from "./text-patterns.js";

const LEAD = /^You can deceive creatures by changing their perception of their allies' behavior\. Each affected creature suspects their allies have changed allegiance, depending on the outcome of their (Fortitude|Reflex|Will) save\. (Regardless of the effects of the saving throw, the creature is then temporarily immune to [a-z ]+ for (\d+) (hour|minute)s?\.)$/;
const SUCCESS = new RegExp(String.raw`^The creature becomes ${C}(Unfriendly)\} to all creatures to which it wasn't already hostile, even those that were previously allies\. It treats no one as an ally for (\d+) (minute|round)s?\. (Each of its former allies within its reach must attempt a save against [a-z ]+\.)$`);
const FAILURE = new RegExp(String.raw`^As success, but the creature is also (${C}Confused\}) for (\d+) (round|minute)s?\.$`);
const CRITICAL = /^As success, but the creature is confused for (\d+) (round|minute)s?\.$/;

/** {html, note, chain, sentences} or null. */
export function rewritePackBreak(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The creature is unaffected." || !success || !failure || !critical) return null;
    const unit = (value, word) => `${value} ${word}${value === "1" ? "" : "s"}`;
    const note = heading => ({ label: "Pack broken", text: "It is Unfriendly to every creature it wasn't already hostile to, former allies included, and treats no one as an ally.",
        sourceText: plain(heading), claimsRow: true, gmPlays: true, rules: [{ key: "GrantItem", uuid: success[1], flag: "conditionUnfriendly", onDeleteActions: { grantee: "restrict" } }],
        duration: { mode: "fixed", value: Number(success[3]), unit: `${success[4]}s`, expiry: success[4] === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: unit(success[3], success[4]) } });
    return {
        html: `<p>The target must attempt a ${lead[1]} save. ${lead[2]}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${failure[1]} for ${unit(failure[3], failure[4])}.</p><p><strong>Critical Failure</strong> The creature is ${failure[1]} for ${unit(critical[1], critical[2])}.</p>`,
        notes: { success: note("Success"), failure: note("Failure"), criticalFailure: note("Critical Failure") },
        chain: { degrees: ["success", "failure", "criticalFailure"], label: "former allies within its reach", sourceText: success[5] },
        sentences: [lead[0], success[5], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
