// Speech bound to praise a named subject (Favorable Review): "You enchant a creature to ensure they have only good things to say about your show.
// Identify a single creature, location, or performance, such as … The target must attempt Will save. You can Dismiss the spell." with rows "The
// target is unaffected and knows you tried to trick it." / "The target is unaffected but thinks your spell was something harmless instead of
// favorable review, unless it identifies the spell (usually using @UUID[…]{Identify Magic})." / "The target cannot speak unfavorably about the
// subject for 1 week. …" / "As failure, except the duration is permanent and the target genuinely holds a favorable opinion about the subject, with
// their attitude toward the creature (or creatures associated with the subject, …) becoming two degrees better (for example, … instead of …).":
// the save and Dismissal; the failing rows a note for their time (the attitude shift in the critical failure's); what the target notices a reminder.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You enchant a creature to [^.]+\. (Identify a single creature, location, or performance), such as [^.]+(?:\.[^.]+)*?\." The target must attempt (Fortitude|Reflex|Will) save\. (You can Dismiss the spell\.)$/;
const KNOWS = /^The target is unaffected and knows you tried to trick it\.$/;
const THINKS = /^The target is unaffected but thinks your spell was something harmless instead of [a-z ]+, unless it identifies the spell \(usually using (?:@UUID\[[^\]]+\]\{Identify Magic\}|Identify Magic)\)\.$/;
const FAILURE = /^The target cannot speak unfavorably about the subject for (\d+) (day|week)s?\. (This doesn't change the target's opinion about the subject, but the target's attempts to speak ill of the subject-whether in speech, writing, or other communication-always twist into compliments and praise instead\.) (The target likely becomes aware of this effect quickly and can avoid speaking about the subject entirely if they choose\.)$/;
const CRITICAL = /^As failure, except the duration is permanent and the target genuinely holds a favorable opinion about the subject, with their attitude toward the creature \(or creatures associated with the subject, such as [^)]+\) becoming two degrees better \(for example, (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Helpful\}|Helpful) instead of (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Indifferent\}|Indifferent)\)\.$/;
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** {html, notes, reminder, sentences} or null. */
export function rewriteReviewRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(row("Failure"));
    if (!lead || lead[2].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !KNOWS.test(row("Critical Success")) || !THINKS.test(row("Success"))
        || !failure || !CRITICAL.test(row("Critical Failure"))) return null;
    const weeks = failure[2] === "week";
    const bound = `The creature can't speak unfavorably about the subject the caster named (a creature, location, or performance): its attempts to speak ill of it, in any form of communication, twist into compliments and praise. It likely notices quickly and can avoid the subject.`;
    return {
        html: `<p>The target must attempt a ${lead[2]} save. You can Dismiss the spell.</p><hr />` + DEGREES.map(([, heading]) => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join("")
            + (heightened ? `<hr />${heightened}` : ""),
        notes: {
            failure: { label: "Favorable review", text: `${bound} Its opinion doesn't change.`, sourceText: row("Failure"), claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: Number(failure[1]) * (weeks ? 7 : 1), unit: "days", expiry: null, anchor: "effect-start", offset: 0, sourceText: `${failure[1]} ${failure[2]}${failure[1] === "1" ? "" : "s"}` } },
            criticalFailure: { label: "Favorable review", text: `${bound} It genuinely holds a favorable opinion of the subject: its attitude toward the named creature (or the creatures associated with the subject, such as a location's owner or a performance's artists) is two steps better (for example, Helpful instead of Indifferent).`,
                sourceText: row("Critical Failure"), claimsRow: true, gmPlays: true, duration: { mode: "unlimited", sourceText: "unlimited" } }
        },
        reminder: { kind: "spell-note", text: "Name the subject (a creature, location, or performance). On a critical success the target knows the caster tried to trick it; on a success it thinks the spell was something harmless unless it identifies the spell.", sourceText: lead[0] },
        sentences: [lead[0], ...DEGREES.map(([, heading]) => `${heading} ${row(heading)}`)]
    };
}
