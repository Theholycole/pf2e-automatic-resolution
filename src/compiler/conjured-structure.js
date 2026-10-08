// A conjured creature with stated statistics that acts from the spell's card (Dragon Turret): "Area (continued) an empty 10-foot radius, 50-foot-tall
// cylinder" / "You conjure forth a massive tower with a large dragon that's bound to crawl its length. The dragon and the tower share the same space, and
// the dragon intercepts any attack targeting the tower. When the dragon dies, the tower crumbles. The dragon is immune to all conditions, has an AC of 40,
// a +30 modifier for all saving throws, and 250 Hit Points. When you Cast the Spell, and once per round when you Sustain it, the dragon unleashes its
// breath in a @Template[type:cone|distance:60], dealing 13d8 damage (basic Reflex save). The damage type depends on the tradition used to cast this
// spell: arcane force, divine spirit, occult mental, primal fire."
// The creature is a token the module makes (user decision 2026-10-01) with those statistics, removed when the spell ends or when it dies; its stated
// action is the card's button (a basic save of the text's dice, the type the casting tradition names).
import { plainOrEmpty as plain } from "./text-patterns.js";

const AREA = /^Area \(continued\) an empty (\d+)-foot radius, (\d+)-foot-tall cylinder$/;
const CONJURE = /^You conjure forth an? [a-z ]+ with an? (?:tiny|small|medium|large|huge|gargantuan) ([a-z]+) that's bound to [a-z ]+\.$/;
const SHARE = /^The ([a-z]+) and the ([a-z]+) share the same space, and the \1 intercepts any attack targeting the \2\.$/;
const DIES = /^When the ([a-z]+) dies, the ([a-z]+) crumbles\.$/;
const STATS = /^The ([a-z]+) is immune to all conditions, has an AC of (\d+), a \+(\d+) modifier for all saving throws, and (\d+) Hit Points\.$/;
const ACTS = /^When you Cast the Spell, and once per round when you Sustain it, the ([a-z]+) unleashes its ([a-z]+) in an? @Template\[(?:type:)?(cone|line|burst|emanation)\|distance:(\d+)\], dealing (\d+d\d+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const TRADITION = /^The damage type depends on the tradition used to cast this spell: ((?:(?:arcane|divine|occult|primal) [a-z]+(?:, )?)+)\.$/;
const CONDITIONS = ["blinded", "broken", "clumsy", "confused", "controlled", "dazzled", "deafened", "doomed", "drained", "dying", "enfeebled", "fascinated", "fatigued", "fleeing", "frightened",
    "grabbed", "immobilized", "off-guard", "paralyzed", "persistent-damage", "petrified", "prone", "quickened", "restrained", "sickened", "slowed", "stunned", "stupefied", "unconscious", "wounded"];

/** {conjure, action, notes, sentences} or null. */
export function extractConjuredStructure(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const parts = html.split(/<hr\s*\/?>/i);
    if (parts.length !== 2) return null;
    const area = AREA.exec(plain(parts[0]).replace(/^Area\s+/, "Area "));
    if (!area) return null;
    const sentences = plain(parts[1]).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== 6) return null;
    const [conjure, share, dies, stats, acts, traditionText] = [CONJURE.exec(sentences[0]), SHARE.exec(sentences[1]), DIES.exec(sentences[2]), STATS.exec(sentences[3]), ACTS.exec(sentences[4]), TRADITION.exec(sentences[5])];
    if (!conjure || !share || !dies || !stats || !acts || !traditionText) return null;
    const name = conjure[1];
    if (share[1] !== name || dies[1] !== name || stats[1] !== name || acts[1] !== name) return null;
    const byTradition = Object.fromEntries([...traditionText[1].matchAll(/(arcane|divine|occult|primal) ([a-z]+)/g)].map(m => [m[1], m[2]]));
    if (Object.keys(byTradition).length !== 4) return null;
    const diameter = Number(area[1]) * 2;
    const size = diameter >= 20 ? "grg" : diameter >= 15 ? "huge" : diameter >= 10 ? "lg" : "med";
    return {
        conjure: { name: `${name} (${share[2]})`, size, ac: Number(stats[2]), saves: Number(stats[3]), hp: Number(stats[4]), immunities: [...CONDITIONS], weaknesses: [], resistances: [],
            traits: [name === "dragon" ? "dragon" : name].filter(trait => /^[a-z]+$/.test(trait)), endsAtZero: true, sourceText: [sentences[0], sentences[3]].join(" ") },
        action: { title: `${name[0].toUpperCase()}${name.slice(1)}'s ${acts[2]}`, area: { type: acts[3], value: Number(acts[4]) }, formula: acts[5], statistic: acts[6].toLowerCase(),
            byTradition, sourceText: [sentences[4], ...sentences.slice(5)].join(" ") },
        notes: [`The ${name} and the ${share[2]} share its space (${diameter} feet across, ${area[2]} feet tall); the ${name} intercepts any attack targeting the ${share[2]}. When the ${name} dies, the ${share[2]} crumbles and the spell ends.`],
        sentences
    };
}
