// A suggestion waiting for its trigger (Subconscious Suggestion): "You implant a subconscious suggestion deep within the target's mind for them to
// follow when a trigger you specify occurs. You suggest a course of action to the target. Your directive must be phrased … and it can't be
// self-destructive or obviously against the target's self-interest. The target must attempt a Will save." with rows "The target is unaffected and
// knows you tried to control it." / "The target is unaffected and thinks you were talking to them normally, not casting a spell on them." / "The
// suggestion remains in the target's subconscious until the next time you prepare. If the trigger occurs before then, the target immediately follows
// your suggestion. The effect has a duration of 1 minute, or until …" / "As failure, but the duration is 1 hour.": the failing rows a note held until
// the caster's next preparations (unlimited: the GM ends it), saying how long the suggestion lasts once triggered; what the target notices a reminder.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You implant a subconscious suggestion deep within the target's mind for them to follow when a trigger you specify occurs\. You suggest a course of action to the target\. (Your directive must be phrased in such a way as to seem like a logical course of action to the target, and it can't be self-destructive or obviously against the target's self-interest\.) The target must attempt a (Fortitude|Reflex|Will) save\.$/;
const FAILURE = /^The suggestion remains in the target's subconscious until the next time you prepare\. If the trigger occurs before then, the target immediately follows your suggestion\. The effect has a duration of (\d+) (minute|hour)s?, or until the target has completed a finite suggestion or the suggestion becomes self-destructive or has other obvious negative effects\.$/;
const CRITICAL = /^As failure, but the duration is (\d+) (minute|hour)s?\.$/;

/** {html, notes, reminder, sentences} or null. */
export function rewriteSuggestionRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[2].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The target is unaffected and knows you tried to control it."
        || plain("Success") !== "The target is unaffected and thinks you were talking to them normally, not casting a spell on them." || !failure || !critical) return null;
    const note = (degree, value, unit) => ({ label: "Subconscious suggestion", text: `The caster's suggestion waits in the creature's subconscious until the caster's next daily preparations (the GM ends this then). If the caster's trigger occurs first, it immediately follows the suggestion for ${value} ${unit}${value === "1" ? "" : "s"}, or until it completes a finite suggestion or the suggestion becomes self-destructive or has other obvious negative effects.`,
        sourceText: plain(degree), claimsRow: true, gmPlays: true, duration: { mode: "unlimited", sourceText: "unlimited" } });
    return {
        html: `<p>The target must attempt a ${lead[2]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join("")
            + (heightened ? `<hr />${heightened}` : ""),
        notes: { failure: note("Failure", failure[1], failure[2]), criticalFailure: note("Critical Failure", critical[1], critical[2]) },
        reminder: { kind: "spell-note", text: `The caster names the trigger and the suggestion (${lead[1].replace(/^Your directive/, "it").replace(/\.$/, "")}). On a critical success the target knows the caster tried to control it; on a success it thinks the caster was just talking.`, sourceText: lead[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
