// A creature stitched to its plane (Planar Tether): "You stitch the target to its current plane. While the target is affected by planar tether, the
// spell attempts to counteract any teleportation effect that would move the target, or any effect that would transport it to a different plane.
// Planar tether's duration is determined by the target's Will save." with rows "The effect's duration is 1 minute." / "… 10 minutes." / "… 1 hour.":
// a note for each row's time carrying the ward — Ongoing spells' counteract control at the cast rank against the teleportation the GM names.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You stitch the target to its current plane\. (While the target is affected by [a-z ]+, the spell attempts to counteract any teleportation effect that would move the target, or any effect that would transport it to a different plane\.) [A-Za-z ]+'s duration is determined by the target's (Fortitude|Reflex|Will) save\.$/;
const ROW = /^The effect's duration is (\d+) (minute|hour)s?\.$/;

/** {html, notes, sentences} or null. */
export function rewritePlaneAnchor(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const timed = ["Success", "Failure", "Critical Failure"].map(heading => ROW.exec(plain(heading)));
    if (!lead || lead[2].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(plain("Critical Success")) || timed.some(match => !match)) return null;
    const note = (heading, [, value, unit]) => ({ label: "Planar tether", text: "The creature is tethered to its plane: when a teleportation effect would move it, or an effect would transport it to another plane, the GM uses Ongoing spells' counteract control (the spell's cast rank).",
        sourceText: plain(heading), claimsRow: true, gmPlays: true, ward: { trigger: "A teleportation effect would move the tethered creature, or an effect would transport it to another plane.", successText: "The teleportation or planar travel fails for it." },
        duration: { mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: null, anchor: "effect-start", offset: 0, sourceText: `${value} ${unit}${value === "1" ? "" : "s"}` } });
    return {
        html: `<p>The target must attempt a ${lead[2]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: note("Success", timed[0]), failure: note("Failure", timed[1]), criticalFailure: note("Critical Failure", timed[2]) },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
