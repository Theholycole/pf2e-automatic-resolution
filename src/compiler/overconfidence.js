// Overconfidence that turns each failure into a penalty (Delusional Pride): "You make the target overconfident, leading it to ascribe failure to
// external factors. The target attempts a Will save to determine the spell's duration and is temporarily immune for 24 hours regardless of the save's
// result." with rows "The duration is 1 round. If the target fails at an attack roll or skill check, it takes a –1 status penalty to attack rolls and
// skill checks until the end of its turn (or the end of its next turn, if it attempted the roll outside its turn). If the creature fails a second time
// while taking this penalty, the penalty increases to –2." / "As success, but the duration is 10 minutes." / "… 24 hours.": the save's immunity; each
// failing row a note for its time whose GM control (the creature failed such a roll) gives the penalty, raised on a second failure.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^The target attempts an? (Fortitude|Reflex|Will) save to determine the spell's duration and is temporarily immune for (\d+) (hour|minute|day)s regardless of the save's result\.$/;
const SUCCESS = /^The duration is (\d+) (round|minute|hour)s?\. If the target fails at an attack roll or skill check, it takes a [–-](\d) (status|circumstance) penalty to attack rolls and skill checks until the end of its turn \(or the end of its next turn, if it attempted the roll outside its turn\)\. If the creature fails a second time while taking this penalty, the penalty increases to [–-](\d)\.$/;
const LATER = /^As success, but the duration is (\d+) (round|minute|hour)s?\.$/;

const length = (value, unit) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `${value} ${unit}${Number(value) === 1 ? "" : "s"}` });

/** {html, notes, sentences} or null. */
export function rewriteOverconfidence(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const save = LEAD.exec(lead[1] ?? "");
    if (lead.length !== 2 || /\d|@/.test(lead[0]) || !save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").trim();
    const success = SUCCESS.exec(row("Success")), failure = LATER.exec(row("Failure")), critical = LATER.exec(row("Critical Failure"));
    if (rows.length !== 4 || !/^The target is unaffected\.$/.test(row("Critical Success")) || !success || !failure || !critical) return null;
    const penalty = { values: [-Number(success[3]), -Number(success[5])], type: success[4], selectors: ["attack-roll", "skill-check"] };
    const text = `Each time it fails an attack roll or skill check, it takes a −${success[3]} ${success[4]} penalty to attack rolls and skill checks until the end of its turn (or of its next turn, if it rolled outside its turn); a second failure while penalized makes it −${success[5]}.`;
    const heading = { success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
    const note = (degree, duration) => ({ label: "Overconfidence", text, sourceText: row(heading[degree]), claimsRow: true, gmPlays: true, duration, triggeredPenalty: JSON.parse(JSON.stringify(penalty)) });
    return {
        html: `<p>The target must attempt a ${save[1]} save. Afterward, the creature is temporarily immune for ${save[2]} ${save[3]}s.</p><hr />`
            + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: note("success", length(success[1], success[2])), failure: note("failure", length(failure[1], failure[2])), criticalFailure: note("criticalFailure", length(critical[1], critical[2])) },
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${row(heading)}`)]
    };
}
