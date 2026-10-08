// A wave whose actions shape it (Weapon Tide): "You conjure a wave of weapons that travel along the ground. Choose bludgeoning, piercing, or slashing. The wave
// deals @Damage[4d6[untyped]] damage of the chosen type to creatures in the area with a basic Reflex save. The number of actions you spend when Casting this
// Spell determines the area and other parameters." / [2] "The spell is a @Template[type:cone|distance:30]." / [3] "The spell is a @Template[…], and the area
// becomes difficult terrain for 1 minute." / "Two Rounds … The spell is a @Template[type:cone|distance:60] that deals @Damage[6d6[untyped]|options:area-damage]
// damage. The area also becomes difficult terrain and hazardous terrain for 1 minute as weapons continue to sporadically shoot from the ground. Any creature
// that moves into or ends its turn in one of these squares takes @Damage[2d6[untyped]|options:area-damage] damage (of the same damage type chosen when you
// Cast the Spell). A creature can take this damage only once per turn." and "Heightened (+2) The initial damage increases by 4d6, and the damage of the
// hazardous terrain increases by 1d6.": PF2e's variant (2 to 3 actions, or the two rounds, told apart by its data) as the basic save of the caster's
// damage type; the 3 actions' difficult terrain, or the two rounds' difficult and hazardous terrain (its damage on entering or ending a turn there, once a
// turn, of the chosen type, heightened), the card's terrain after the save.
import { plain, sentenceSplit as split } from "./text-patterns.js";

const TYPES = /^Choose ([a-z]+), ([a-z]+), or ([a-z]+)\.$/;
const DEALS = /^The [a-z]+ deals @Damage\[(\d+)d(\d+)\[untyped\]\] damage of the chosen type to creatures in the area with a basic (Fortitude|Reflex|Will) save\.$/;
const ACTIONS = /^The number of actions you spend when Casting this Spell determines the area and other parameters\.$/;
const TEMPLATE = String.raw`@Template\[type:(cone|burst|emanation|line)\|distance:(\d+)\]`;
const TWO = new RegExp(String.raw`^The spell is a ${TEMPLATE}\.$`);
const THREE = new RegExp(String.raw`^The spell is a ${TEMPLATE}, and the area becomes difficult terrain for (\d+) minutes?\.$`);
const ROUNDS_LEAD = "If you spend 3 actions casting the spell, you can avoid finishing the spell and spend another 2 actions on your next turn to empower the spell even further. You can take other actions before finishing this spell, but the spell is lost if you Cast another Spell in between.";
const ROUNDS_AREA = new RegExp(String.raw`^The spell is a ${TEMPLATE} that deals @Damage\[(\d+)d(\d+)\[untyped\]\|options:area-damage\] damage\.$`);
const ROUNDS_TERRAIN = /^The area also becomes difficult terrain and hazardous terrain for (\d+) minutes? as [a-z ]+\.$/;
const ROUNDS_HAZARD = /^Any creature that moves into or ends its turn in one of these squares takes @Damage\[(\d+)d(\d+)\[untyped\]\|options:area-damage\] damage \(of the same damage type chosen when you Cast the Spell\)\.$/;
const ONCE = /^A creature can take this damage only once per turn\.$/;
const STEP = /^Heightened \(\+(\d)\) The initial damage increases by (\d+)d(\d+), and the damage of the hazardous terrain increases by (\d+)d(\d+)\.$/;

/** {html, types, choiceSentence, areaTerrain, twoRounds, claimed} or null. */
export function rewriteWeaponWave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !/^2 to (?:3|2 rounds)$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped") return null;
    const [body, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!heightened || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 4) return null;
    const lead = split(plain(paragraphs[0]).replace(/(?<=[a-z]{2}\.)(?=[A-Z])/g, " "));
    const at = lead.findIndex(sentence => TYPES.test(sentence));
    if (at < 0 || lead.length !== at + 3 || lead.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|terrain|bonus|penalty)\b/i.test(sentence))) return null;
    const types = TYPES.exec(lead[at]).slice(1), deals = DEALS.exec(lead[at + 1]);
    if (!deals || !ACTIONS.test(lead[at + 2]) || deals[3].toLowerCase() !== adapted.defense.statistic) return null;
    const two = /^<span class="action-glyph">2<\/span>\s*([\s\S]*)$/.exec(paragraphs[1]), three = /^<span class="action-glyph">3<\/span>\s*([\s\S]*)$/.exec(paragraphs[2]);
    const roundsBody = /^<strong>\s*Two Rounds\s*<\/strong>\s*([\s\S]*)$/.exec(paragraphs[3]);
    if (!two || !three || !roundsBody) return null;
    const twoArea = TWO.exec(plain(two[1])), threeArea = THREE.exec(plain(three[1]));
    const roundsText = plain(roundsBody[1]);
    if (!twoArea || !threeArea || !roundsText.startsWith(ROUNDS_LEAD)) return null;
    const roundsParts = split(roundsText.slice(ROUNDS_LEAD.length).trim());
    const roundsArea = ROUNDS_AREA.exec(roundsParts[0] ?? ""), roundsTerrain = ROUNDS_TERRAIN.exec(roundsParts[1] ?? ""), hazard = ROUNDS_HAZARD.exec(roundsParts[2] ?? "");
    if (roundsParts.length !== 4 || !roundsArea || !roundsTerrain || !hazard || !ONCE.test(roundsParts[3]) || twoArea[1] !== threeArea[1] || twoArea[2] !== threeArea[2]) return null;
    const step = STEP.exec(plain(heightened));
    if (!step || step[3] !== deals[2] || step[5] !== hazard[2] || adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== Number(step[1])
        || String(adapted.heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== `${step[2]}d${step[3]}`) return null;
    // Which variant this is: its data (the two rounds' area and dice, or the 2/3 actions').
    const formula = String(components[0].formula).replace(/\s+/g, ""), area = adapted.targeting?.area;
    const sameArea = (type, value) => area?.type === type && Number(area.value) === Number(value);
    const twoRounds = formula === `${roundsArea[3]}d${roundsArea[4]}` && sameArea(roundsArea[1], roundsArea[2]);
    if (!twoRounds && !(formula === `${deals[1]}d${deals[2]}` && sameArea(twoArea[1], twoArea[2]))) return null;
    const baseRank = Number(adapted.rank) || 1, interval = Number(step[1]);
    const terrainSentence = twoRounds ? roundsParts[1] : plain(three[1]);
    return {
        html: `<p>${lead.slice(0, at).join(" ")} Each creature in the area takes ${formula} damage (basic ${deals[3]} save).</p>`
            + `<hr /><p><strong>Heightened (+${interval})</strong> The damage increases by ${step[2]}d${step[3]}.</p>`,
        types, choiceSentence: lead[at], twoRounds,
        areaTerrain: twoRounds
            ? { durationSeconds: Number(roundsTerrain[1]) * 60, sourceText: terrainSentence, hazard: { events: ["enter", "turn-end"], oncePerTurn: true, chosenType: true,
                formula: `(${hazard[1]}+floor((@item.rank-${baseRank})/${interval})*${step[4]})d${hazard[2]}`, type: "chosen", label: "the weapons", sourceText: roundsParts[2] } }
            : { durationSeconds: Number(threeArea[3]) * 60, sourceText: terrainSentence, whenActions: 3 },
        claimed: [...lead, plain(two[1]), plain(three[1]), ROUNDS_LEAD, ...roundsParts, plain(heightened)]
    };
}
