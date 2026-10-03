// A pit that drags creatures toward its center (Antlion Trap):
//   "You transmute the ground into a conical pit trap of loose sand that becomes difficult terrain for the duration. A creature or unsecured object
//   that enters the sand or starts its turn in the sand is moved toward the center, depending on the result of its Reflex save. This is forced
//   movement. If there isn't enough space near the center of the pit, affected creatures and objects move as far as they can without being
//   blocked, up to the amount set by their saving throw outcomes." with rows "Success The creature moves 5 feet toward the center." / "Failure …
//   10 feet …" / "Critical Failure As failure, and the creature becomes @UUID[…]{Immobilized} in the pit. It can attempt to @UUID[…]{Escape}
//   against your spell DC." and "Heightened (+2) Increase the area of the spell and the amount a creature moves on a failure by 5 feet."
// The lingering area (difficult terrain; a save on entering and at the start of a turn inside), the rows written plainly (Immobilized until it
// Escapes); the heightened step grows the burst and the failing rows' pull. Unsecured objects and the blocked-space rule are GM notes.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = [
    /^You transmute the ground into a conical pit trap of loose sand that becomes difficult terrain for the duration\.$/,
    /^A creature or unsecured object that enters the sand or starts its turn in the sand is moved toward the center, depending on the result of its (Fortitude|Reflex|Will) save\.$/,
    /^This is forced movement\.$/,
    /^If there isn't enough space near the center of the pit, affected creatures and objects move as far as they can without being blocked, up to the amount set by their saving throw outcomes\.$/
];
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: /^The creature moves (\d+) feet toward the center\.$/,
    failure: /^The creature moves (\d+) feet toward the center\.$/,
    criticalFailure: new RegExp(String.raw`^As failure, and the creature becomes (${C}Immobilized\}) in the pit\. It can attempt to @UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Escape\} against your spell DC\.$`)
};
const STEP = /^Heightened \(\+(\d)\) Increase the area of the spell and the amount a creature moves on a failure by (\d+) feet\.$/;
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

/** {html, areaStep, moveStep, notes, claimed} or null. */
export function rewriteAntlionPit(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(lead[index])) || LEAD[1].exec(lead[1])[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? row[1].replace(/\s+/g, " ").trim() : "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    const step = heightened ? STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim()) : null;
    if (heightened && !step) return null;
    const statistic = LEAD[1].exec(lead[1])[1];
    return {
        html: `<p>All surfaces in the area are difficult terrain. Each creature that enters the area or starts its turn in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature moves ${rows.success[1]} feet toward the center.</p>`
            + `<p><strong>Failure</strong> The creature moves ${rows.failure[1]} feet toward the center.</p><p><strong>Critical Failure</strong> As failure, and the creature is ${rows.criticalFailure[1]} until it Escapes.</p>`,
        areaStep: step ? { interval: Number(step[1]), feet: Number(step[2]), baseRank: Number(adapted.rank) || 1, sourceText: htmlToPlainText(heightened).trim() } : null,
        moveStep: step ? { interval: Number(step[1]), feet: Number(step[2]), sourceText: htmlToPlainText(heightened).trim() } : null,
        notes: ["Unsecured objects that enter the sand or start a turn in it are dragged toward the center too (the GM moves them).", lead[3]],
        claimed: [...lead, ...written]
    };
}
