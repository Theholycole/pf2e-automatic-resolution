// A save that suppresses the target's darkvision or low-light vision (Darkened Eyes):
//   "You infuse a creature's vision with darkness. After attempting its save, the target becomes temporarily immune for 24 hours." with rows
//   "Success The target's darkvision or low-light vision is suppressed for 1 round." / "Failure As success, but the duration is 1 minute." /
//   "Critical Failure As success, but the duration is 1 minute, and the target is also @UUID[…]{Blinded} for the duration. It can attempt a new
//   save at the end of each of its turns. If it succeeds, it's no longer Blinded, but its darkvision or low-light vision remains suppressed."
// PF2e has no rule that suppresses a sense: the suppression is a note Effect for its duration (the GM plays it). The critical failure's
// Blinded is PF2e's condition with the end-of-turn save that ends it (the recurring-save lifetime).
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES } from "./text-patterns.js";

const SENSES = "darkvision or low-light vision";
const ROWS = {
    criticalSuccess: /^The target is unaffected\.$/,
    success: new RegExp(`^The target's ${SENSES} is suppressed for (\\d+) (round|minute)s?\\.$`),
    failure: /^As success, but the duration is (\d+) (round|minute)s?\.$/,
    criticalFailure: new RegExp(`^As success, but the duration is (\\d+) (round|minute)s?, and the target is also (@UUID\\[Compendium\\.pf2e\\.conditionitems\\.Item\\.[A-Za-z0-9]+\\]\\{Blinded\\}) for the duration\\. It can attempt a new save at the end of each of its turns\\. If it succeeds, it's no longer Blinded, but its ${SENSES} remains suppressed\\.$`)
};

/** {html, notes: {degree: note}, claimed} or null. */
export function rewriteSenseSuppression(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? htmlToPlainText(row[1]).replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${text}`);
    }
    const note = (value, unit, sourceText) => ({ label: "Vision suppressed", text: `Its ${SENSES} is suppressed: it sees as a creature without that sense (the GM plays it).`,
        sourceText, gmPlays: true, duration: { mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `for ${value} ${unit}${Number(value) === 1 ? "" : "s"}` } });
    const [, cfValue, cfUnit, blinded] = rows.criticalFailure;
    return {
        html: `<p>${body.replace(/^<p>|<\/p>$/g, "")}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is ${blinded} for ${cfValue} ${cfUnit}${Number(cfValue) === 1 ? "" : "s"}. It can attempt a new save at the end of each of its turns to end the blinded condition.</p>`,
        notes: { success: note(rows.success[1], rows.success[2], written[1]), failure: note(rows.failure[1], rows.failure[2], written[2]), criticalFailure: note(cfValue, cfUnit, written[3]) },
        claimed: written
    };
}
