// A command backed by the target's true name (Compel True Name): "You instruct the target to do something, compelling obedience by calling it by its
// true name. Your instructions can't be self-destructive. Though this spell has the linguistic trait, this applies only to the instructions; the
// creature doesn't need to know its own true name to be affected. The target must attempt a Will saving throw." with rows "The target is
// unaffected, is temporarily immune to further castings of this spell by you for 1 week, and learns your true name." / "… for 1 day, and learns a
// fragment of your true name." / "The target does as you command. The spell has a duration of 10 minutes, or until the target has completed a finite
// instruction or the instructions become selfdestructive. The creature is temporarily immune to further castings of this spell by you for 1 hour." /
// "As failure, but the spell's duration is 8 hours, and the creature is not temporarily immune.": the save; each row's immunity to this caster for
// its own time (none on a critical failure); the obedience a note for its time; what the target learns a card reminder.
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES } from "./text-patterns.js";

const LEAD = /^You instruct the target to do something, compelling obedience by calling it by its true name\. (Your instructions can't be self-destructive\.) (Though this spell has the linguistic trait, this applies only to the instructions; the creature doesn't need to know its own true name to be affected\.) The target must attempt a (Fortitude|Reflex|Will) saving throw\.$/;
const UNAFFECTED = /^The target is unaffected, is temporarily immune to further castings of this spell by you for (\d+) (hour|day|week)s?, and learns (your true name|a fragment of your true name)\.$/;
const FAILURE = /^The target does as you command\. The spell has a duration of (\d+) (minute|hour)s?, or until the target has completed a finite instruction or the instructions become self-?destructive\. The creature is temporarily immune to further castings of this spell by you for (\d+) (hour|day)s?\.$/;
const CRITICAL = /^As failure, but the spell's duration is (\d+) (minute|hour)s?, and the creature is not temporarily immune\.$/;

const span = (value, unit) => unit === "week" ? { value: Number(value) * 7, unit: "days" } : { value: Number(value), unit: `${unit}s` };

/** {html, notes, immunity, learns, sentences} or null. */
export function rewriteTrueNameCommand(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").trim();
    const critical = UNAFFECTED.exec(row("Critical Success")), success = UNAFFECTED.exec(row("Success")), failure = FAILURE.exec(row("Failure")), worst = CRITICAL.exec(row("Critical Failure"));
    if (!lead || lead[3].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !critical || !success || !failure || !worst
        || critical[3] !== "your true name" || success[3] !== "a fragment of your true name") return null;
    const obey = (value, unit, degree) => ({ label: "Compelled", text: `The creature obeys the caster's instruction (which can't be self-destructive). End this Effect early once it has completed a finite instruction or the instructions become self-destructive.`,
        sourceText: row(degree), claimsRow: true, gmPlays: true,
        duration: { mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: `${value} ${unit}${value === "1" ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${lead[3]} save.</p><hr />` + DEGREES.map(([, heading]) => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { failure: obey(failure[1], failure[2], "Failure"), criticalFailure: obey(worst[1], worst[2], "Critical Failure") },
        immunity: { byCaster: true, degrees: ["criticalSuccess", "success", "failure"],
            byDegree: { criticalSuccess: span(critical[1], critical[2]), success: span(success[1], success[2]), failure: span(failure[3], failure[4]) },
            duration: span(failure[3], failure[4]), sourceText: [row("Critical Success"), row("Success"), row("Failure"), row("Critical Failure")].join(" ") },
        learns: { kind: "spell-note", text: "On a critical success the target learns the caster's true name; on a success, a fragment of it.", sourceText: `Critical Success ${row("Critical Success")}` },
        sentences: [lead[0], ...DEGREES.map(([, heading]) => `${heading} ${row(heading)}`)]
    };
}
