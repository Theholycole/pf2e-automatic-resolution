// A lingering area that loosens a kind of terrain and counteracts the effects that make it (Scouring Sand):
//   "For the duration of the spell, any plant-based difficult terrain smaller than a tree becomes loose, allowing each 5-foot square of
//   it to be cleared with a single Interact action." / "In addition, scouring sand attempts to counteract @UUID[…]{Entangling Flora} and
//   other effects that create or manipulate plant-based terrain in its area." / "Successfully counteracting an effect removes only the
//   portion of its area that overlaps with scouring sand's area." / "After one such attempt, the effect is temporarily immune to
//   scouring sand's counteract for 24 hours."
// The terrain is the GM's (a reminder); the counteract is the card's counteract control against the named spell, with the overlap and
// the 24-hour immunity in its text. Heightened entries that only let the caster move the area on Sustain (and change range and area as
// the item's own data does) are a GM note: the GM moves the area's region.
import { htmlToPlainText } from "./description-parser.js";

const TERRAIN = /^For the duration of the spell, any ([a-z-]+) difficult terrain(?: smaller than an? [a-z]+)? becomes loose, allowing each 5-foot square of it to be cleared with a single Interact action\.$/;
const COUNTERACT = /^In addition, ([a-z' ]+) attempts to counteract (@UUID\[Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+\]\{([^}]+)\}) and other effects that create or manipulate ([a-z-]+) terrain in its area\.$/;
const PORTION = name => new RegExp(String.raw`^Successfully counteracting an effect removes only the portion of its area that overlaps with ${name}'s area\.$`);
const IMMUNE = name => new RegExp(String.raw`^After one such attempt, the effect is temporarily immune to ${name}'s counteract for (\d+) hours\.$`);
const MOVE = /^<p>\s*<strong>\s*Heightened \((\d)(?:st|nd|rd|th)\)\s*<\/strong>\s*Once per round when you Sustain the Spell, you can move the center of the (burst|cylinder) to a spot within range\.\s*<\/p>$/;
const AS_MOVE = /^<p>\s*<strong>\s*Heightened \((\d)(?:st|nd|rd|th)\)\s*<\/strong>\s*As the (\d)(?:st|nd|rd|th)-rank version, except the range is (\d+) feet and the area is a (\d+)-foot (burst|cylinder)\.\s*<\/p>$/;

/** {reminders, notes, sentences} or null. `sentences` are the plain preamble sentences (the save trigger already claimed). */
export function compileAreaCounteractTerrain(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const sentences = htmlToPlainText(html.split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0])
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const name = String(adapted.source?.name ?? "").toLowerCase();
    const terrainAt = sentences.findIndex(sentence => TERRAIN.test(sentence));
    const counterAt = sentences.findIndex(sentence => COUNTERACT.test(sentence));
    if (terrainAt < 0 || counterAt !== terrainAt + 1) return null;
    const counter = COUNTERACT.exec(sentences[counterAt]);
    if (counter[1] !== name || counter[4] !== TERRAIN.exec(sentences[terrainAt])[1]) return null;
    const portion = sentences[counterAt + 1], immune = sentences[counterAt + 2];
    if (!PORTION(name).test(portion ?? "") || !IMMUNE(name).test(immune ?? "")) return null;
    const plain = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    // The heightened entries: none, or a move-on-Sustain entry and at most one "as that version, except …" matching the item's data.
    const entries = [...html.matchAll(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    const notes = [];
    const move = entries.map(entry => MOVE.exec(entry)).filter(Boolean);
    const as = entries.map(entry => AS_MOVE.exec(entry)).filter(Boolean);
    if (move.length + as.length !== entries.length || move.length > 1 || (as.length && !move.length) || as.length > 1) return null;
    if (move.length) {
        const [, rank, shape] = move[0];
        if (shape !== adapted.targeting?.area?.type) return null;
        notes.push(`At rank ${rank} or higher: once per round when you Sustain, you can move the center of the ${shape} to a spot within range (move the area's region).`);
        if (as.length) {
            const [, at, base, range, feet, asShape] = as[0];
            const level = adapted.heightening?.type === "fixed" ? adapted.heightening.levels?.[at] : null;
            if (base !== rank || asShape !== shape || Number(level?.area?.value) !== Number(feet) || String(level?.range?.value ?? "") !== `${range} feet`) return null;
        }
    }
    return {
        reminders: [
            { kind: "surroundings", text: `${sentences[terrainAt]} The GM clears the squares.`, sourceText: sentences[terrainAt] },
            { kind: "counteract-spell", target: counter[3].toLowerCase(),
                text: `${plain(sentences[counterAt])} ${portion} ${immune} Roll the counteract check once for each such effect in the area.`, sourceText: sentences[counterAt] }
        ],
        notes,
        sentences: [sentences[terrainAt], sentences[counterAt], portion, immune]
    };
}
