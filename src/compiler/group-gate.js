// Conditions that apply only when several targets fail (Entangle Fate):
//   "You cause a swirl of energy to entangle the fates of all caught within the blast. Each creature in the area must attempt a Will save." with
//   rows "Success … become @UUID[…]{Off-Guard} until the start of its next turn." / "Failure As success, but the creature is off-guard for the
//   duration of the spell. If more than one of the targets failed to resist this spell, the creature also becomes @UUID[…]{Stupefied 1} for the
//   duration of the spell as …" / "Critical Failure As failure, but any creature that becomes stupefied 1 for the duration of the spell also
//   becomes @UUID[…]{Enfeebled 1} and @UUID[…]{Clumsy 1} for the spell's duration."
// The rows written out plainly; the gated conditions apply at Finalize only when at least two targets got a failure or critical failure.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, DEGREE_LABEL_PAIRS as DEGREES, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const LEAD = /^Each creature in the area must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: new RegExp(String.raw`^The creature's [a-z ,]+ cause the creature to become (${C}Off-Guard\}) until the start of its next turn\.$`),
    failure: new RegExp(String.raw`^As success, but the creature is off-guard for the duration of the spell\. If more than one of the targets failed to resist this spell, the creature also becomes (${C}Stupefied 1\}) for the duration of the spell as [a-z ,]+\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, but any creature that becomes stupefied 1 for the duration of the spell also becomes (${C}Enfeebled 1\}) and (${C}Clumsy 1\}) for the spell's duration\.$`)
};

/** {html, gated: [labels], claimed} or null. */
export function rewriteGroupGate(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (!lead.length || !LEAD.test(lead.at(-1)) || LEAD.exec(lead.at(-1))[1].toLowerCase() !== adapted.defense.statistic || lead.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? htmlToPlainText(row[1]).replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${text}`);
    }
    const offGuard = rows.success[1], stupefied = rows.failure[1], [, enfeebled, clumsy] = rows.criticalFailure;
    // ("for the spell's duration" of a fixed duration: that duration.)
    const fixed = /^(\d+) (round|minute)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!fixed || adapted.lifecycle?.sustained) return null;
    const span = `for ${fixed[1]} ${fixed[2].toLowerCase()}${fixed[1] === "1" ? "" : "s"}`;
    return {
        html: `<p>${lead.at(-1)}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is ${offGuard} until the start of its next turn.</p>`
            + `<p><strong>Failure</strong> The creature is ${offGuard} ${span}. The creature is ${stupefied} ${span}.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${offGuard} ${span}. The creature is ${stupefied} ${span}. The creature is ${enfeebled} ${span}. The creature is ${clumsy} ${span}.</p>`,
        gated: ["stupefied", "enfeebled", "clumsy"],
        rule: { degrees: ["failure", "criticalFailure"], minimum: 2, sourceText: written[2] },
        claimed: [...lead, ...written]
    };
}
