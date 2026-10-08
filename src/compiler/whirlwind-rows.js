// A whirlwind that knocks down, then grows harsher on each Sustain (Cyclone Rondo): "… you call up a whirlwind. When the whirlwind appears, each creature in
// its area must attempt a Reflex save or be knocked {Prone}. The area of the whirlwind is difficult terrain." / "The whirlwind grows harsher when you Sustain
// the Spell, moving up to 10 feet within your range and dealing each creature whose space it enters or passes through 4d6 damage with a basic Reflex save."
// with "Heightened (+1) The damage increases by 1d6.": a placed area of difficult terrain for the sustained spell; when it appears, its creatures save or
// fall Prone; on each Sustain the GM moves the region and the creatures it covers (and any it passed through, added on review) take the basic save of the
// damage at the cast rank.
import { htmlToPlainText } from "./description-parser.js";
import { HEIGHTENED_DAMAGE_STEP_ONE as STEP } from "./text-patterns.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z-]+)\}`;
const APPEARS = new RegExp(String.raw`^When the ([a-z]+) appears, each creature in its area must attempt an? (Fortitude|Reflex|Will) save or be knocked ${C}\.$`);
const TERRAIN = /^The area of the ([a-z]+) is difficult terrain\.$/;
const SUSTAIN = /^The ([a-z]+) grows harsher when you Sustain the Spell, moving up to (\d+) feet within your range and dealing each creature whose space it enters or passes through (\d+)d(\d+) damage with a basic (Fortitude|Reflex|Will) save\.$/;

/** {html, lingering, sentences} or null. */
export function rewriteWhirlwind(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length || components.length !== 1 || components[0].category) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = first.findIndex(sentence => APPEARS.test(sentence));
    if (at < 0 || first.length !== at + 2 || first.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|terrain|bonus|penalty|condition)\b/i.test(sentence))) return null;
    const appears = APPEARS.exec(first[at]), terrain = TERRAIN.exec(first[at + 1]), sustain = SUSTAIN.exec(htmlToPlainText(paragraphs[1]).trim());
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!appears || !terrain || !sustain || !step || terrain[1] !== appears[1] || sustain[1] !== appears[1] || appears[2] !== sustain[5] || appears[2].toLowerCase() !== adapted.defense.statistic) return null;
    const dice = Number(sustain[3]), faces = sustain[4];
    if (String(components[0].formula).replace(/\s+/g, "") !== `${dice}d${faces}` || step[2] !== faces || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== 1
        || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== `${step[1]}d${faces}`) return null;
    const type = String(components[0].type).toLowerCase();
    const baseRank = Number(adapted.rank) || 1;
    const condition = `@UUID[${appears[3]}]{${appears[4]}}`;
    const area = adapted.targeting.area;
    return {
        html: `<p>Each creature in the area must attempt a ${appears[2]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is knocked ${condition}.</p><p><strong>Critical Failure</strong> The creature is knocked ${condition}.</p>`,
        lingering: { events: ["sustain"], initial: true, oncePerRound: false, excludeCaster: false, enemiesOnly: false, area: { type: area.type, value: Number(area.value) }, centre: "placed",
            durationSeconds: Number(minutes[1]) * 60, terrain: { difficulty: 2, movement: ["walk"], hazardous: false }, sustained: true, concealment: false,
            notes: [`Each time you Sustain it, you can move the area up to ${sustain[2]} feet within range: move the region first; each creature in it (and any whose space it passed through: add them on review) takes the damage, with a basic ${appears[2]} save.`],
            sourceText: [first[at], first[at + 1], htmlToPlainText(paragraphs[1]).trim()],
            sustainBasic: { formula: `(${dice}+(@item.rank - ${baseRank})*${step[1]})d${faces}[${type}]`, type, sourceText: htmlToPlainText(paragraphs[1]).trim() } },
        sentences: [...first, htmlToPlainText(paragraphs[1]).trim(), htmlToPlainText(heightened).trim()]
    };
}
