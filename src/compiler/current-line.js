// A line of water current that moves the creatures in it (Control Currents, PF2e 8.6):
//   "Any sections of the area that intersect with a body of water become a current, flowing either away from you or toward you (each section must flow in
//   the same direction). Creatures or vehicles that start their turn within the current or enter it for the first time on their turn are moved 10 feet in the
//   direction of the current. Unwilling creatures or vehicles can attempt a Fortitude save to avoid this effect. Creatures or vehicles that move against the
//   direction of the current treat it as difficult terrain." with "Heightened (4th) The movement increases to 20 feet, and the area becomes a 60-foot line."
// Two lingering modes the card asks for — the current flowing away from the caster (a push) or toward it (a pull) — each the area's turn-start and entering
// save, its failing rows the move (20 feet from the heightened rank). Which squares are water, a willing creature (no save), vehicles and the difficult
// terrain against the current are the GM's reminders.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [
    /^Any sections of the area that intersect with a body of water become a current, flowing either away from you or toward you \(each section must flow in the same direction\)\.$/,
    /^Creatures or vehicles that start their turn within the current or enter it for the first time on their turn are moved (\d+) feet in the direction of the current\.$/,
    /^Unwilling creatures or vehicles can attempt an? (Fortitude|Reflex|Will) save to avoid this effect\.$/,
    /^Creatures or vehicles that move against the direction of the current treat it as difficult terrain\.$/
];
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The movement increases to (\d+) feet, and the area becomes an? (\d+)-foot line\.\s*<\/p>$/;
const sentencesOf = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** {modes: [{key, label, html}], feet, heightened, notes, sentences} or null. */
export function extractCurrentLine(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    if (adapted.targeting?.area?.type !== "line" || String(adapted.targeting?.target ?? "").trim()) return null;
    const [body, heightenedHTML, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const lead = sentencesOf(body);
    if (lead.length !== LEAD.length || !lead.every((sentence, index) => LEAD[index].test(sentence))) return null;
    const feet = Number(LEAD[1].exec(lead[1])[1]);
    const save = LEAD[2].exec(lead[2])[1];
    if (save.toLowerCase() !== adapted.defense.statistic) return null;
    const step = heightenedHTML ? HEIGHTENED.exec(heightenedHTML) : null;
    if (heightenedHTML && (!step || Number(step[1]) <= Number(adapted.rank ?? 1))) return null;
    const rows = move => `<p>Each creature that enters or starts its turn in the area must attempt a ${save} save.</p><hr />`
        + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
        + `<p><strong>Failure</strong> The creature is ${move}.</p><p><strong>Critical Failure</strong> The creature is ${move}.</p>`;
    return {
        modes: [
            { key: "away", label: "Flowing away from you", html: rows(`pushed ${feet} feet away from you`) },
            { key: "toward", label: "Flowing toward you", html: rows(`pulled ${feet} feet toward you`) }
        ],
        feet,
        heightened: step ? { minRank: Number(step[1]), feet: Number(step[2]), lineFeet: Number(step[3]), sourceText: htmlToPlainText(heightenedHTML).trim() } : null,
        notes: [
            "Only the sections of the line that cross a body of water are a current: leave out creatures outside the water when you review them.",
            "A willing creature doesn't save: set its result to failure. Vehicles are moved the same way (the GM moves them).",
            "A creature moving against the current treats it as difficult terrain; a creature is moved by entering only the first time on its turn (the GM's)."
        ],
        sentences: lead
    };
}
