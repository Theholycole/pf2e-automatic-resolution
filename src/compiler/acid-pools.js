// Pools that strike creatures starting a turn in them or entering them (Corrosive Muck): "Area all squares in two @Template[burst|distance:10]{10-foot
// bursts}." / "You create two puddles of acidic slime that hinders the movement of anyone who walks through them." / "The area of each pool becomes
// greater difficult terrain." / "Each round that a creature starts its turn in one of the pools or enters a pool during a move action it's using, it
// takes 8d6 acid damage with a basic Reflex save." / "A creature that critically fails its saving throw also takes @Damage[1d6[acid,persistent]]."
// / "As normal, if a Large or larger creature starts its turn in both pools, it takes the damage only once." with "Heightened (+2) Create an
// additional 10-foot burst.": separate lingering areas (one more each 2 ranks) of greater difficult terrain, a creature exposed once a round as it
// starts its turn in one or enters one, by the save's rows (the persistent acid on a critical failure). PF2e's item has no area: the text's.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const AREA = /^<p>\s*<strong>\s*Area\s*<\/strong>\s*all squares in (two|three) @Template\[burst\|distance:(\d+)\]\{\2-foot bursts\}\.\s*<\/p>$/i;
const TERRAIN = /^The area of each pool becomes greater difficult terrain\.$/;
const STRIKE = /^Each round that a creature starts its turn in one of the pools or enters a pool during a move action it's using, it takes (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const CRIT = /^A creature that critically fails its saving throw also takes (@Damage\[\d+d\d+\[(?:[a-z]+,persistent|persistent,[a-z]+)\]\])(?: damage)?\.$/;
const ONCE = /^As normal, if a Large or larger creature starts its turn in both pools, it takes the damage only once\.$/;
const STEP = /^Heightened \(\+(\d)\) Create an additional (\d+)-foot burst\.$/;

/** {html, area, areaCountStep, notes, sentences} or null. */
export function rewriteAcidPools(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    if (!/^\d+ minutes?$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    const [area, body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const pools = AREA.exec(area ?? "");
    if (!pools || !body || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 5 || NARRATION_RULES.test(sentences[0].replace(/^You create (two|three) /, "You create ")) || !TERRAIN.test(sentences[1]) || !ONCE.test(sentences[4])) return null;
    const strike = STRIKE.exec(sentences[2]), crit = CRIT.exec(sentences[3]), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!strike || !crit || !step || Number(step[2]) !== Number(pools[2]) || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== strike[1] || String(components[0].type).toLowerCase() !== strike[2] || strike[3].toLowerCase() !== adapted.defense.statistic
        || adapted.heightening?.damage) return null;
    const persistent = crit[1].replace(/\[([a-z]+),persistent\]\]$/, "[persistent,$1]]");
    return {
        html: `<p><strong>Area</strong> ${pools[1]} ${pools[2]}-foot bursts that don't overlap</p><hr />`
            + `<p>Each creature that enters or starts its turn in one of the pools takes ${strike[1]} ${strike[2]} damage and must attempt a ${strike[3]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage and ${persistent} damage.</p>`,
        area: { type: "burst", value: Number(pools[2]) },
        areaCountStep: { baseRank: Number(adapted.rank), interval: Number(step[1]), add: 1, sourceText: htmlToPlainText(heightened).trim() },
        sentences: [htmlToPlainText(area).trim(), ...sentences]
    };
}
