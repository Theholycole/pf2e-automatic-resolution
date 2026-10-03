// A basic-save blast whose area, save and damage type come from the caster's zodiac constellation (Shining Starlight Attack; user decision
// 2026-10-01: the choice is asked when casting):
//   "The constellation then releases a powerful blast that deals 2d10 damage to all enemies in either a @Template[type:line|distance:30] or
//   @Template[type:cone|distance:15], with a basic save against your arcane spell DC." / "Enemies that critically fail are Dazzled until the
//   start of your next turn." / "The damage type, traits, area, and saving throw are determined by your zodiac constellation (see below)." with
//   the table "Constellation | Attack (Area, Save, Damage Type; Traits)".
// Rewritten to the ordinary basic save of the enemies in the area (the critical failure's Dazzled as its rider), with the damage type as the
// caster's choice; the cast picks the constellation, which sets the save and the damage type (and says the area and traits).
import { htmlToPlainText } from "./description-parser.js";

const DAMAGE_TYPES = new Set(["acid", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality", "void"]);
const BLAST = /^The constellation then releases a powerful blast that deals (\d+)d(\d+) damage to all enemies in either a @Template\[type:(line|cone)\|distance:(\d+)\] or @Template\[type:(line|cone)\|distance:(\d+)\], with a basic save against your [a-z]+ spell DC\.$/;
const RIDER = /^Enemies that critically fail are (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+\}) until the start of your next turn\.$/;
const DETERMINED = /^The damage type, traits, area, and saving throw are determined by your zodiac constellation \(see below\)\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;

/** One table row: "Volcanic vents (line, Reflex, fire)" / "Storming petals and pollen (line, Fortitude; poison, plant, wood)". */
function parseRow(name, text, areas) {
    const inner = /\(([^()]+)\)\s*$/.exec(text)?.[1];
    if (!inner) return null;
    const [main, traitPart = ""] = inner.split(";").map(part => part.trim());
    const words = main.split(",").map(word => word.trim().toLowerCase()).filter(Boolean);
    const extra = traitPart.split(",").map(word => word.trim().toLowerCase()).filter(Boolean);
    const area = words.find(word => word in areas), save = words.find(word => ["fortitude", "reflex", "will"].includes(word));
    let type = words.find(word => DAMAGE_TYPES.has(word));
    // A row without a damage type before its traits takes the first trait that is one ("…; poison, plant, wood").
    if (!type) type = extra.find(word => DAMAGE_TYPES.has(word));
    if (!area || !save || !type || words.some(word => word !== area && word !== save && word !== type)) return null;
    return { name, area: { type: area, value: areas[area] }, statistic: save, damageType: type, traits: extra.filter(word => word !== type) };
}

/** {html, constellations, sentences} or null. */
export function extractConstellationBlast(adapted) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped") return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3 || !/^<p>\s*<strong>\s*Area\s*<\/strong>\s*varies \(see below\)\s*<\/p>$/i.test(sections[0])) return null;
    const sentences = htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0])) return null;
    const blast = BLAST.exec(sentences[1]), rider = RIDER.exec(sentences[2]);
    if (!blast || !rider || !DETERMINED.test(sentences[3]) || `${blast[1]}d${blast[2]}` !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const areas = { [blast[3]]: Number(blast[4]), [blast[5]]: Number(blast[6]) };
    // The Heightened entry, then the table.
    const [heightened, table] = [sections[2].split(/<table\b/i)[0], /<table\b[\s\S]*<\/table>/i.exec(sections[2])?.[0] ?? ""];
    const step = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+d\d+)\.\s*<\/p>$/.exec(heightened.trim());
    if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === step[2])) return null;
    const rows = [...table.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi)].map(match => parseRow(htmlToPlainText(match[1]).trim(), htmlToPlainText(match[2]).trim(), areas));
    if (!rows.length || rows.some(row => !row) || new Set(rows.map(row => row.name)).size !== rows.length) return null;
    return {
        html: `<p>Each enemy in the area takes ${blast[1]}d${blast[2]} untyped damage (basic Reflex save). Creatures that critically fail are ${rider[1]} until the start of your next turn.</p>`,
        constellations: rows, sentences
    };
}
