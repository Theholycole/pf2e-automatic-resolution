// A save whose only damage is persistent, scaled by the result (Freezing Touch):
//   "… The target takes 5d4 persistent cold damage and must attempt a Fortitude save." with rows "Success The target takes half the persistent
//   cold damage." / "Failure The target takes the full persistent cold damage and is @UUID[…]{Immobilized} for 1 minute or until it Escapes. Once
//   per round, if the target uses or is affected by an effect with the fire trait, it can attempt to Escape as a free action or immediately roll
//   a flat check to end the persistent cold damage (…)." / "Critical Failure As a failure, but double the persistent cold damage, and the creature
//   is @UUID[…]{Off-Guard} for as long as it's immobilized."
// The rows written out plainly (half, full, double damage; Immobilized for 1 minute or until it Escapes; Off-Guard while immobilized). PF2e ignores
// a damage multiplier on persistent damage, so the card scales the persistent formula itself (sharedDamage.persistentScaled). The fire-trait
// escape is a GM note on the failing rows.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const LEAD = /^The target takes (\d+d\d+) persistent ([a-z]+) damage and must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: /^The target is unaffected\.$/,
    success: /^The target takes half the persistent ([a-z]+) damage\.$/,
    failure: new RegExp(String.raw`^The target takes the full persistent ([a-z]+) damage and is (${C}Immobilized\}) for (\d+) (round|minute)s? or until it Escapes\. (Once per round, if the target uses or is affected by an effect with the ([a-z]+) trait, it can attempt to Escape as a free action or immediately roll a flat check to end the persistent \1 damage \([^)]*\)\.)$`),
    criticalFailure: new RegExp(String.raw`^As a failure, but double the persistent ([a-z]+) damage, and the creature is (${C}Off-Guard\}) for as long as it's immobilized\.$`)
};
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** {html, note, claimed} or null. */
export function rewritePersistentRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category !== "persistent") return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = lead.findIndex(sentence => LEAD.test(sentence));
    if (at < 0 || at !== lead.length - 1 || lead.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, dice, type, statistic] = LEAD.exec(lead[at]);
    if (statistic.toLowerCase() !== adapted.defense.statistic || String(components[0].formula).replace(/\s+/g, "") !== dice || String(components[0].type).toLowerCase() !== type) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match || (match[1] && degree !== "criticalSuccess" && match[1] !== type)) return null;
        rows[degree] = match;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    const [, , immobilized, value, unit, fireRule] = rows.failure, offGuard = rows.criticalFailure[2];
    const span = `for ${value} ${unit}${value === "1" ? "" : "s"} or until it Escapes`;
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${immobilized} ${span}.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${immobilized} ${span}. It is ${offGuard} for as long as it is immobilized.</p>${rest.length ? `<hr />${rest[0]}` : ""}`,
        note: { label: "Fire loosens it", text: `${fireRule} (The GM plays it: an Escape as a free action, or the flat check at DC 10.)`, sourceText: htmlToPlainText(fireRule), gmPlays: true,
            duration: { mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${value} ${unit}` } },
        claimed: [...lead, ...written]
    };
}
