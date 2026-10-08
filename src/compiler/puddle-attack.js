// A spell attack whose hit leaves a damaging area around the target (Disintegrating Puddle):
//   "Make a ranged spell attack against the target." / "On a success, the target takes 2d12 acid damage, and acid splatters to the ground in the
//   target's space and all spaces adjacent to the target." / "On a critical hit, the target takes double damage." / "The acid puddle lasts for
//   1 minute; a creature that enters or starts its turn in the acid puddle takes @Damage[(floor(@item.level / 2))d4[acid]] damage." with
//   "Heightened (+2) The initial acid damage increases by 2d12, and the acid puddle damage increases by 1d4."
// Rewritten to an ordinary spell attack of the initial damage, with the ground hazard on each hit: the runtime draws the puddle (the target's
// space and the squares adjacent to it) for its duration, and a creature entering it or starting its turn in it takes its damage (no save).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const ATTACK = /^Make a (ranged|melee) spell attack against the target\.$/;
const HIT = /^On a success, the target takes (\d+)d(\d+) ([a-z]+) damage, and ([a-z]+) splatters to the ground in the target's space and all spaces adjacent to the target\.$/;
const CRIT = /^On a critical hit, the target takes double damage\.$/;
const PUDDLE = /^The ([a-z]+) puddle lasts for (\d+) (round|minute)s?; a creature that enters or starts its turn in the \1 puddle takes @Damage\[\(floor\(@item\.(?:level|rank) ?\/ ?(\d)\)\)d(\d+)\[([a-z]+)\]\] damage\.$/;

/** {html, groundHazard, sentences} or null. */
export function extractPuddleAttack(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || adapted.defense?.kind !== "none" || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?;])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => ATTACK.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 4 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
    const [attack, hit, crit, puddle] = sentences.slice(at);
    const range = ATTACK.exec(attack), damage = HIT.exec(hit), area = PUDDLE.exec(puddle);
    if (!range || !damage || !CRIT.test(crit) || !area || damage[4] !== area[1]) return null;
    if (`${damage[1]}d${damage[2]}` !== String(components[0].formula).replace(/\s+/g, "") || damage[3] !== String(components[0].type).toLowerCase()) return null;
    // "Heightened (+N) The initial … damage increases by XdY, and the … puddle damage increases by 1dZ.": the initial dice are the item's; the
    // puddle's formula already rises one die per N ranks.
    const entries = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    if (entries.length > 1) return null;
    if (entries.length) {
        const step = new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The initial ${damage[3]} damage increases by (\d+)d${damage[2]}, and the ${area[1]} puddle damage increases by 1d${area[5]}\.\s*<\/p>$`).exec(entries[0]);
        if (!step || Number(step[1]) !== Number(area[4]) || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
            && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${damage[2]}`)) return null;
    }
    return {
        html: `<p>Make a ${range[1]} spell attack roll against the target. On a hit, the target takes ${damage[1]}d${damage[2]} ${damage[3]} damage (double damage on a critical hit).</p>`,
        // The existing ground hazard (the target's squares), here with the adjacent ones too, on a hit.
        groundHazard: { where: "target-and-adjacent", degrees: ["criticalSuccess", "success"], events: ["enter", "turn-start"],
            damage: { formula: `(floor(@item.rank/${area[4]}))d${area[5]}`, type: area[6] }, duration: { mode: "fixed", value: Number(area[2]), unit: `${area[3]}s` },
            label: `${area[1]} puddle`, sourceText: puddle },
        sentences: sentences.slice(at)
    };
}
