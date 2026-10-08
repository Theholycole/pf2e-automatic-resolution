// Conjured structures with statistics (Steel Fortifications; user decisions 2026-10-01: a token with the stated statistics, and terrain for only
// some creatures as the module's region):
//   "You c[r]eate up to three Large structures within range in unoccupied squares; each fortification is 8 feet long, 8 feet wide, and 8 feet
//   tall." / "There must be enough room for a fortification in order to conjure it." / "A single fortification has an AC of 10 and is immune to
//   critical hits and precision damage." / "It has Hardness 9, 60 Hit Points, and a BT of 30." / "Once a fortification is broken, it crumbles into
//   sharp metal bits." / "Any creature adjacent to or sharing a space with a fortification when it is broken must attempt a Reflex save or take
//   2d6 persistent bleed damage." / "Creatures can pass through the spaces of a fortification, though Medium and larger creatures treat these
//   spaces as difficult terrain." and the cover and climbing sentences.
// Each structure is a PF2e hazard token (AC, Hardness, Hit Points, Broken Threshold, the immunities) for the duration, with a region on its
// spaces that's difficult terrain for Medium and larger creatures only. When it's broken it's removed and the creatures adjacent to or in it
// get the save (a degree save: the failure's persistent damage). Cover and climbing are notes.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, SIZE_SLUGS_TO_HUGE as SIZES, WORD_NUMBERS_1_5 as WORDS } from "./text-patterns.js";

const CREATE = /^You (?:create|creature|conjure) up to (one|two|three|four|five) (Tiny|Small|Medium|Large|Huge) structures within range in unoccupied squares; each ([a-z]+) is \d+ feet long, \d+ feet wide, and \d+ feet tall\.$/;
const ROOM = /^There must be enough room for an? ([a-z]+) in order to conjure it\.$/;
const STATS = /^A single ([a-z]+) has an AC of (\d+) and is immune to critical hits and precision damage\.$/;
const DURABILITY = /^It has Hardness (\d+), (\d+) Hit Points, and a BT of (\d+)\.$/;
const CRUMBLE = /^Once an? ([a-z]+) is broken, it crumbles into [a-z ]+\.$/;
const BROKEN_SAVE = /^Any creature adjacent to or sharing a space with an? ([a-z]+) when it is broken must attempt an? (Fortitude|Reflex|Will) save or take (@Damage\[\d+d\d+\[persistent,[a-z]+\]\]|\d+d\d+ persistent [a-z]+) damage\.$/;
const TERRAIN = /^Creatures can pass through the spaces of an? ([a-z]+), though (Tiny|Small|Medium|Large|Huge) and larger creatures treat these spaces as difficult terrain\.$/;
const NOTES = [/^An? (?:Tiny|Small|Medium) or smaller creature can occupy the same spaces as an? [a-z]+; doing so grants them standard cover\.$/,
    /^Similarly, an? (?:@UUID\[[^\]]+\]\{Prone\}|prone) (?:Tiny|Small|Medium) creature can occupy the same spaces as an? [a-z]+, gaining standard cover in the process\.$/,
    /^An? (?:Tiny|Small|Medium|Large) or smaller creature can climb an? [a-z]+ with a successful @Check\[athletics\|dc:(\d+)\] check\.$/];

/** {fortifications, crumbleHtml, claimed} or null. */
export function extractFortifications(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/i.exec(String(adapted.targeting?.range ?? "").trim());
    if (!minutes || !range || adapted.lifecycle?.sustained || /<hr/i.test(adapted.descriptionHTML ?? "")) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => CREATE.test(sentence));
    if (at < 0 || at > 1 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const create = CREATE.exec(sentences[at]), noun = create[3];
    const [room, stats, durability, crumble, broken, terrain] = [ROOM, STATS, DURABILITY, CRUMBLE, BROKEN_SAVE, TERRAIN].map((pattern, index) => pattern.exec(sentences[at + 1 + index] ?? ""));
    if (!room || !stats || !durability || !crumble || !broken || !terrain || [room[1], stats[1], crumble[1], broken[1], terrain[1]].some(word => word !== noun)) return null;
    const notes = sentences.slice(at + 7);
    if (notes.length !== NOTES.length || !notes.every((sentence, index) => NOTES[index].test(sentence))) return null;
    if (Number(durability[3]) >= Number(durability[2])) return null;
    const persistent = /^@Damage\[(\d+d\d+)\[persistent,([a-z]+)\]\]$/.exec(broken[3]) ?? /^(\d+d\d+) persistent ([a-z]+)$/.exec(broken[3]);
    const plain = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/@Check\[athletics\|dc:(\d+)\]/g, "Athletics (DC $1)");
    return {
        fortifications: {
            count: WORDS[create[1]], size: SIZES[create[2]], name: noun, rangeFeet: Number(range[1]), durationSeconds: Number(minutes[1]) * 60,
            ac: Number(stats[2]), hardness: Number(durability[1]), hp: Number(durability[2]), brokenThreshold: Number(durability[3]), immunities: ["critical-hits", "precision"],
            terrain: { minSize: SIZES[terrain[2]], difficulty: 2 },
            broken: { statistic: broken[2].toLowerCase(), persistent: { formula: persistent[1], type: persistent[2] }, sourceText: sentences[at + 5] },
            notes: [plain(room[0]), ...notes.map(plain)]
        },
        // The save when one breaks: a degree save of the creatures adjacent to or in it (its failure's persistent damage).
        crumbleHtml: `<p>Each creature in the area must attempt a ${broken[2]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature takes @Damage[${persistent[1]}[persistent,${persistent[2]}]] damage.</p><p><strong>Critical Failure</strong> The creature takes @Damage[${persistent[1]}[persistent,${persistent[2]}]] damage.</p>`,
        claimed: sentences.slice(at)
    };
}
