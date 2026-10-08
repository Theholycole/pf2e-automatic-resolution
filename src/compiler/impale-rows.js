// A spike that impales on a failed save (Impaling Spike):
//   "You conjure a spike that thrusts up from the earth beneath a target creature, potentially impaling it." / "The spike is made of cold iron and
//   deals 8d6 piercing damage." / "The target must attempt a Reflex save." with rows "Critical Success The target dodges the spike and is
//   unaffected." / "Success The target is struck by the spike and takes half damage." / "Failure The target is impaled through a leg or another
//   nonvital body part. The creature takes full damage and, if it's standing on solid ground, becomes @UUID[…]{Immobilized}. It can attempt to
//   @UUID[…]{Escape} (the DC is your spell DC). While it remains impaled, it takes damage from any weakness to cold iron it has at the end of
//   each of its turns." / "Critical Failure As failure, but the creature is impaled through a vital organ or its center of mass, taking double
//   damage, and it is @UUID[…]{Off-Guard} as long as it's impaled."
// Rewritten to the plain rows: Immobilized until it Escapes (spell DC), and on a critical failure Off-Guard for as long as it's immobilized. The
// solid-ground condition and the weakness damage at the end of its turns are the GM's (a note on the failing rows).
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, MUST_ATTEMPT_SAVE as SAVE } from "./text-patterns.js";

const MADE_OF = /^The ([a-z]+) is made of ([a-z ]+) and deals (\d+d\d+) ([a-z]+) damage\.$/;
const LINK = String.raw`@UUID\[Compendium\.pf2e\.[a-z0-9-]+\.Item\.[A-Za-z0-9]+\]\{`;
const ROWS = {
    criticalSuccess: /^The target [a-z ]+ the ([a-z]+) and is unaffected\.$/,
    success: /^The target is struck by the ([a-z]+) and takes half damage\.$/,
    failure: new RegExp(String.raw`^The target is impaled through [a-z ,]+\. The creature takes full damage and, if it's standing on solid ground, becomes (${LINK}Immobilized\})\. It can attempt to ${LINK}Escape\} \(the DC is your spell DC\)\. While it remains impaled, it takes damage from any weakness to ([a-z ]+) it has at the end of each of its turns\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, but the creature is impaled through [a-z ,]+, taking double damage, and it is (${LINK}Off-Guard\}) as long as it's impaled\.$`)
};

/** {html, note, claimed} or null. */
export function rewriteImpaleRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || String(adapted.targeting?.target ?? "").trim() !== "1 creature") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== 3 || NARRATION_RULES.test(lead[0])) return null;
    const made = MADE_OF.exec(lead[1]), save = SAVE.exec(lead[2]);
    if (!made || !save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const material = made[2].replace(/\s+/g, "-");
    if (String(components[0].formula).replace(/\s+/g, "") !== made[3] || String(components[0].type).toLowerCase() !== made[4] || !(components[0].materials ?? []).includes(material)) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${text}`);
    }
    if (rows.criticalSuccess[1] !== made[1] || rows.success[1] !== made[1] || rows.failure[2].replace(/\s+/g, "-") !== material) return null;
    const immobilized = rows.failure[1], offGuard = rows.criticalFailure[1];
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target takes half damage.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${immobilized} until it Escapes.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${immobilized} until it Escapes. It is ${offGuard} for as long as it is immobilized.</p>${rest.length ? `<hr />${rest[0]}` : ""}`,
        note: { label: "Impaled", text: `Impaled by the ${made[1]}: it's Immobilized only if it's standing on solid ground (remove Immobilized otherwise). While it remains impaled, it takes damage equal to any weakness to ${made[2]} it has at the end of each of its turns (the GM applies it). It can Escape against the spell DC.`,
            sourceText: written[2], gmPlays: true, duration: { mode: "fixed", value: 1, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: "the spell's duration" } },
        claimed: [...lead, ...written]
    };
}
