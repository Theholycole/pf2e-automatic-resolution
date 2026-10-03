// Illusory hazards in separate squares (Ephemeral Hazards): "Area (continued) four 10-foot-by-10-foot spaces" / "You create illusory hazards, such as
// spinning blades or a puddle of acid, in four 10-foot-by–10-foot spaces within range. The hazards are merely a mental projection, and a creature receives a
// Will save each time it touches a hazard or is occupying one's space at the start of its turn. Depending on the result, the creature takes 4d6 mental damage
// and might have difficulty moving through the area. A creature can take this damage only once per turn, even if it moves through several hazards. Choose
// bludgeoning, … damage when you Cast ephemeral hazards; resistances and weaknesses to those damage types apply if the target thinks they do, as judged by the
// GM. You can freely choose the appearance and damage type of each hazard …" with rows "unaffected by the hazards and no longer needs to attempt Will saves
// against them." / "realizes the hazards aren't real but still takes half damage from them; on future Will saves against the hazards, the creature continues
// to use this result unless it rolls a critical success." / "full damage and treats the square as difficult terrain." / "double damage and can't pass through
// a square containing a hazard." — the four placed squares as one lingering area (entering or starting a turn in one; once per turn): the item's damage by
// the rows; a critical success immune for the spell; a success's later saves at least a success (PF2e's degree adjustment on its Will saves against this
// spell); a failure's or critical failure's squares difficult terrain for it; the critical failure's barrier and the damage type the GM's notes.
import { htmlToPlainText } from "./description-parser.js";

const AREA = /^Area \(continued\) (four|three|two|five) (\d+)-foot-by-(\d+)-foot spaces$/;
const LEAD = [/^You create illusory hazards, such as [a-z ,]+, in (four|three|two|five) (\d+)-foot-by[-–](\d+)-foot spaces within range\.$/,
    /^The hazards are merely a mental projection, and a creature receives a (Will|Fortitude|Reflex) save each time it touches a hazard or is occupying one's space at the start of its turn\.$/,
    /^Depending on the result, the creature takes (\d+)d(\d+) ([a-z]+) damage and might have difficulty moving through the area\.$/,
    /^A creature can take this damage only once per turn, even if it moves through several hazards\.$/,
    /^Choose ([a-z, ]+) damage when you Cast [a-z ]+; resistances and weaknesses to those damage types apply if the target thinks they do, as judged by the GM\.$/,
    /^You can freely choose the appearance and damage type of each hazard as long as its appearance reflects the type of damage it deals \(for instance, [^)]+\)\.$/];
const ROWS = { criticalSuccess: /^The creature is unaffected by the hazards and no longer needs to attempt Will saves against them\.$/,
    success: /^The creature realizes the hazards aren't real but still takes half damage from them; on future Will saves against the hazards, the creature continues to use this result unless it rolls a critical success\.$/,
    failure: /^The target takes full damage and treats the square as difficult terrain\.$/,
    criticalFailure: /^The target takes double damage and can't pass through a square containing a hazard\.$/ };
const HEADINGS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
const COUNTS = { two: 2, three: 3, four: 4, five: 5 };

/** {html, lingering additions, successLock, immunity, notes, claimed} or null. */
export function rewriteHazardSquares(adapted) {
    const components = adapted.damageComponents ?? [];
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "square" || components.length !== 1) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [areaHTML, body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const area = AREA.exec(htmlToPlainText(areaHTML ?? "").replace(/\s+/g, " ").trim());
    if (!minutes || !area || !table || rest.length || Number(area[2]) !== Number(adapted.targeting.area.value) || area[2] !== area[3]) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const lead = LEAD[0].exec(sentences[0]), save = LEAD[1].exec(sentences[1]), damage = LEAD[2].exec(sentences[2]);
    if (lead[1] !== area[1] || save[1].toLowerCase() !== adapted.defense.statistic || `${damage[1]}d${damage[2]}` !== String(components[0].formula).replace(/\s+/g, "")
        || damage[3] !== String(components[0].type).toLowerCase()) return null;
    const written = [];
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = htmlToPlainText(row?.[1] ?? "").replace(/\s+/g, " ").trim();
        if (!ROWS[degree].test(text)) return null;
        written.push(`${heading} ${text}`);
    }
    const statistic = save[1];
    return {
        html: `<p>Each creature that enters the area or starts its turn in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage.</p>${heightened.trim() ? `<hr />${heightened}` : ""}`,
        lingering: { areaCount: COUNTS[area[1]], separateAreas: true, oncePerTurn: true,
            rowTerrain: { degrees: ["failure", "criticalFailure"], until: "spell", sourceText: written[2] },
            successLock: { statistic: statistic.toLowerCase(), sourceText: written[1] } },
        immunity: { degrees: ["criticalSuccess"], sourceText: written[0] },
        notes: [`The hazards deal mental damage; each looks like ${LEAD[4].exec(sentences[4])[1].replace(/, or /, " or ")} damage (your choice): the GM applies resistances and weaknesses to that type if the creature believes them.`,
            "A creature that critically failed can't pass through a square containing a hazard."],
        claimed: [htmlToPlainText(areaHTML).trim(), ...sentences, ...written]
    };
}
