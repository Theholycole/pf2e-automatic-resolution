// Cubes of twisted space (Strange Geometry): "Area 4 cubes, each 10 feet on a side" / "You cause the areas to appear to swell, bend, and break, … The cubes of
// the spell's area can't be adjacent to one another. A creature must attempt a Will save if it's in one of the cubes when you Cast the Spell, or if it later
// enters one of the areas, with the following effects. A creature interacting with the illusion can also attempt a Will save to disbelieve the illusion, as
// normal." with rows "The creature disbelieves the illusion." / "All terrain in the cubes is difficult terrain for the creature, … When the creature would
// exit one of the cubes, it exits from one randomly determined by the GM. This is a teleportation effect. …" (no critical rows: they're the ordinary
// ones'): the GM's placed cubes (separate areas); each creature saves once, in one when cast or entering one (immune for the spell after any result); a
// failure's note for the spell — the cubes' terrain and the random exit, the GM's — with its disbelief control (a Will save; success ends its note).
import { htmlToPlainText } from "./description-parser.js";
import { WORD_NUMBERS_2_5 as COUNTS, NARRATION_RULES_SHORT as NARRATION_RULES } from "./text-patterns.js";

const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*(\d+|two|three|four|five) cubes, each (\d+) feet on a side\s*<\/p>/i;
const APART = /^The cubes of the spell's area can't be adjacent to one another\.$/;
const WHO = /^A creature must attempt an? (Fortitude|Reflex|Will) save if it's in one of the cubes when you Cast the Spell, or if it later enters one of the areas, with the following effects\.$/;
const DISBELIEVE = /^A creature interacting with the illusion can also attempt an? (Will) save to disbelieve the illusion, as normal\.$/;

/** {html, lingering, immunity, note, sentences} or null. */
export function rewriteTwistedCubes(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "cube" || adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    const area = AREA.exec(html.trim());
    const [body, table, ...rest] = html.trim().replace(AREA, "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !area || !table || rest.length) return null;
    const count = COUNTS[area[1].toLowerCase()] ?? Number(area[1]);
    if (!(count >= 2 && count <= 5) || Number(area[2]) !== Number(adapted.targeting.area.value)) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const who = WHO.exec(sentences[2] ?? ""), disbelieve = DISBELIEVE.exec(sentences[3] ?? "");
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !APART.test(sentences[1]) || !who || !disbelieve || who[1].toLowerCase() !== adapted.defense.statistic || disbelieve[1] !== who[1]) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = plain("Failure");
    if (rows.length !== 2 || plain("Success") !== "The creature disbelieves the illusion." || !/^All terrain in the cubes is difficult terrain for the creature\b/.test(failure)
        || !/\bit exits from one randomly determined by the GM\./.test(failure) || /\d|@|\b(?:damage|bonus|penalty|condition)\b/i.test(failure)) return null;
    const span = { value: Number(minutes[1]), unit: "minutes" };
    return {
        html: `<p>A creature in the area when you Cast the Spell or that enters the area must attempt a ${who[1]} save.</p><hr />`
            + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The creature is unaffected.</p>`).join(""),
        lingering: { events: ["enter"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: "cube", value: Number(area[2]) }, centre: "placed",
            areaCount: count, separateAreas: true, durationSeconds: span.value * 60, sustained: false, concealment: false,
            notes: [`${sentences[1]} Place the ${count} cubes as separate regions.`], sourceText: [sentences[1], sentences[2]] },
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { ...span }, sourceText: sentences[2] },
        note: { label: "Strange geometry", text: `${failure} (The GM plays it.) It can disbelieve the illusion when it interacts with it: a ${who[1]} save, ending this on a success.`,
            sourceText: failure, claimsRow: true, gmPlays: true, duration: { mode: "fixed", value: span.value, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: adapted.lifecycle.duration },
            disbelieve: { statistic: "will", endsSpell: false, needs: "success" } },
        sentences: [...sentences, plain("Success"), failure]
    };
}
