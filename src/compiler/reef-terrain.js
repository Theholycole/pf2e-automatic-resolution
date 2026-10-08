// Bursts that strike when cast and leave hazardous terrain (Coral Eruption): "Area two 10-foot bursts that don't overlap" / "Razor sharp coral erupts
// from the ground, transforming the landscape into a dangerous coral reef." / "You can create a third nonoverlapping burst if the centers of all
// three bursts are underwater." / "Creatures in the area when the spell is cast take 6d6 piercing damage and must attempt a basic Reflex save." /
// "A creature that critically fails its saving throw also takes @Damage[1d6[persistent,bleed]] damage." / "The area becomes difficult terrain
// and hazardous terrain." / "A creature that moves through the area takes @Damage[(floor(@item.rank/2)+1)[piercing]] damage for every square of
// that area it moves into." with "Heightened (+2) The initial piercing damage increases by 3d6, and the hazardous terrain damage increases by 1.":
// the save's rows (the bleed on a critical failure); after Finalize the GM selects the bursts' regions and the card places the terrain for the
// duration, its per-square damage the GM's control (target the creature and give the squares) at the cast rank.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*(two) (\d+)-foot bursts that don't overlap\s*<\/p>$/i;
const THIRD = /^You can create a third nonoverlapping burst if the centers of all three bursts are underwater\.$/;
const CAST = /^Creatures in the area when the spell is cast take (\d+d\d+) ([a-z]+) damage and must attempt a basic (Fortitude|Reflex|Will) save\.$/;
const CRIT = /^A creature that critically fails its saving throw also takes (@Damage\[\d+d\d+\[persistent,[a-z]+\]\]) damage\.$/;
const TERRAIN = /^The area becomes difficult terrain and hazardous terrain\.$/;
const PER_SQUARE = /^A creature that moves through the area takes @Damage\[\(floor\(@item\.rank\/2\)\+(\d+)\)\[([a-z]+)\]\] damage for every square of that area it moves into\.$/;
const STEP = /^Heightened \(\+2\) The initial ([a-z]+) damage increases by (\d+d\d+), and the hazardous terrain damage increases by 1\.$/;

/** {html, areaTerrain, sentences} or null. */
export function rewriteReefTerrain(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [area, body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const bursts = AREA.exec(area ?? "");
    if (!minutes || !bursts || !body || rest.length || Number(bursts[2]) !== Number(adapted.targeting.area.value)) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (first.length !== 4 || second.length !== 2 || NARRATION_RULES.test(first[0]) || !THIRD.test(first[1]) || !TERRAIN.test(second[0])) return null;
    const cast = CAST.exec(first[2]), crit = CRIT.exec(first[3]), square = PER_SQUARE.exec(second[1]);
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!cast || !crit || !square || !step || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== cast[1]
        || String(components[0].type).toLowerCase() !== cast[2] || cast[3].toLowerCase() !== adapted.defense.statistic || step[1] !== cast[2]) return null;
    // (The item's heightening step is PF2e's; the per-square damage's is floor(rank/2), 1 more every 2 ranks, as stated.)
    if (String(adapted.heightening?.damage?.[components[0].id] ?? "").trim() !== step[2] || Number(adapted.heightening?.interval) !== 2) return null;
    return {
        html: `<p>Creatures in the area take ${cast[1]} ${cast[2]} damage and must attempt a ${cast[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage and ${crit[1]} damage.</p>`
            + `<hr /><p><strong>Heightened (+2)</strong> The initial ${cast[2]} damage increases by ${step[2]}.</p>`,
        areaTerrain: { durationSeconds: Number(minutes[1]) * 60, sourceText: second[0], count: 2,
            gmHazard: { kind: "per-square", enemiesOnly: false, formula: `(floor(@item.rank/2)+${square[1]})`, type: square[2], sourceText: second[1] },
            notes: [first[1]] },
        sentences: [htmlToPlainText(area).trim(), ...first, ...second, htmlToPlainText(heightened).trim()]
    };
}
