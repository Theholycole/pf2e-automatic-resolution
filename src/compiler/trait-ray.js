// A spell attack with extra damage by the target's traits, a weapon requirement and a situational die upgrade (Sun Blade):
//   "You must be wielding a sword or spear to cast sun blade, and you perform this spell's somatic component with the weapon." / "Make a spell
//   attack roll." / "The ray deals 1d4 fire damage." / "If the target is unholy, the ray deals an additional 1d4 spirit damage, and if the
//   target is undead, the ray deals an additional 1d4 vitality damage (both effects apply against creatures that are both unholy and undead)."
//   / "If you are in an area of bright natural sunlight, increase the die size of each damage die by one step (from d4 to d6)." with the table
//   "Critical Success The ray deals double damage." / "Success The ray deals full damage." and "Heightened (+1) The damage increases by 1d4
//   fire, 1d4 spirit, and 1d4 vitality (or 1d6 of each type of damage in bright natural sunlight)."
// Rewritten to an ordinary spell attack of the base damage, with: each trait's extra damage (PF2e traits, scaled like the hit), the weapon
// requirement as the GM's cast question, and the sunlight upgrade as the caster's question (every die, the extras too).
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const REQUIRE = /^You must be wielding an? ([a-z]+) or ([a-z]+) to cast [a-z ]+, and you perform this spell's somatic component with the weapon\.$/;
const ATTACK = /^Make a spell attack roll\.$/;
const DEALS = /^The ([a-z]+) deals (\d+)d(\d+) ([a-z]+) damage\.$/;
const EXTRAS = /^If the target is ([a-z]+), the [a-z]+ deals an additional (\d+)d(\d+) ([a-z]+) damage, and if the target is ([a-z]+), the [a-z]+ deals an additional (\d+)d(\d+) ([a-z]+) damage \(both effects apply against creatures that are both \1 and \5\)\.$/;
const UPGRADE = /^If you are in an area of bright natural sunlight, increase the die size of each damage die by one step \(from d(\d+) to d(\d+)\)\.$/;
const CRITICAL = /^<p>\s*<strong>\s*Critical Success\s*<\/strong>\s*The [a-z]+ deals double damage\.\s*<\/p>$/;
const SUCCESS = /^<p>\s*<strong>\s*Success\s*<\/strong>\s*The [a-z]+ deals full damage\.\s*<\/p>$/;

/** {html, extras, gate, upgrade, sentences} or null. */
export function extractTraitRay(adapted) {
    if (!adapted.activation?.traits?.includes("attack") || adapted.defense?.kind !== "none" || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3) return null;
    const rows = [...sections[1].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    if (rows.length !== 2 || !CRITICAL.test(rows[0]) || !SUCCESS.test(rows[1])) return null;
    const sentences = htmlToPlainText(sections[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => REQUIRE.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 5 || (at === 1 && NARRATION_RULES.test(sentences[0]))) return null;
    const [require, attack, deals, extras, upgrade] = sentences.slice(at);
    const need = REQUIRE.exec(require), base = DEALS.exec(deals), extra = EXTRAS.exec(extras), up = UPGRADE.exec(upgrade);
    if (!need || !ATTACK.test(attack) || !base || !extra || !up) return null;
    if (`${base[2]}d${base[3]}` !== String(components[0].formula).replace(/\s+/g, "") || base[4] !== String(components[0].type).toLowerCase()) return null;
    if (Number(up[1]) !== Number(base[3]) || [extra[3], extra[7]].some(faces => Number(faces) !== Number(base[3]))) return null;
    // "Heightened (+1) The damage increases by 1d4 fire, 1d4 spirit, and 1d4 vitality (…)": every entry steps by one die.
    const step = new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The damage increases by 1d${base[3]} ${base[4]}, 1d${base[3]} ${extra[4]}, and 1d${base[3]} ${extra[8]} \(or 1d${up[2]} of each type of damage in bright natural sunlight\)\.\s*<\/p>$`).test(sections[2]);
    if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === 1 && adapted.heightening.damage?.[components[0].id] === `1d${base[3]}`)) return null;
    const rank = Number(adapted.rank) || 1;
    const scaled = count => `(${Number(count) - rank === 0 ? "@item.rank" : `@item.rank ${Number(count) - rank > 0 ? "+" : "-"} ${Math.abs(Number(count) - rank)}`})d${base[3]}`;
    return {
        html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${base[2]}d${base[3]} ${base[4]} damage (double damage on a critical hit).</p>`,
        extras: [{ trait: extra[1], formula: `${scaled(extra[2])}[${extra[4]}]`, damageType: extra[4], sourceText: extras },
            { trait: extra[5], formula: `${scaled(extra[6])}[${extra[8]}]`, damageType: extra[8], sourceText: extras }],
        gate: { question: `Is the caster wielding a ${need[1]} or ${need[2]}? If not, the spell can't be cast (no creature is affected).`, sourceText: require },
        upgrade: { faces: Number(up[2]), question: "Is the caster in an area of bright natural sunlight? If so, every damage die is one size larger.", sourceText: upgrade },
        sentences: sentences.slice(at)
    };
}
