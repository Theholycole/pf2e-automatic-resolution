// A bomb of magic others can fuel (Mystic Bomb): "Your mystic bomb appears in the location and deals 4d6 damage to each creature within the area on a basic Reflex save and
// the bomb disappears. The damage of your mystic bomb is of the same damage type as your Arcane Cascade. If no creatures are in the area, the bomb remains in the area. On
// subsequent rounds, the first time you Sustain this Spell each round, you can leave the mystic bomb in its space or move it to another square within range, immediately
// exploding after this action is completed if any creatures are in its area. At the end of each turn that you Sustain the Spell, you can choose to increase the size of
// the burst by 5 feet, up to a maximum of a 20-foot burst." / "For the duration of the spell, allies within 60 feet of your mystic bomb can attempt to Aid you … making
// an Athletics or Arcana check at a standard DC of your level. If they succeed, they increase the number of damage dice the spell deals by 1d6, or by 2d6 if they
// critically succeed. After an ally successfully Aids you in this way, they cannot Aid you again and you can only receive Aid for this spell 3 times before further
// attempts automatically fail, treating critical successes as 2 times …" with "Heightened (+1) The initial damage increases by 1d6 and the number of times your spell
// can receive Aid increases by 1.": the placed burst a region; it explodes at once on the creatures in it (a basic save card of the dice, of the Arcane Cascade's type),
// or stays — the caster's Effect for the sustained duration with its controls: explode after a Sustain's move (the creatures then in it), grow by 5 feet (to 20), and an
// ally's Aid (the higher of Athletics and Arcana against the level's DC; the dice and the uses kept); Expansive Spellstrike a note.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const TEXT = [/^Your mystic bomb appears in the location and deals (\d+)d(\d+) damage to each creature within the area on a basic (Fortitude|Reflex|Will) save and the bomb disappears\.$/,
    /^The damage of your mystic bomb is of the same damage type as your Arcane Cascade\.$/, /^If no creatures are in the area, the bomb remains in the area\.$/,
    /^On subsequent rounds, the first time you Sustain this Spell each round, you can leave the mystic bomb in its space or move it to another square within range, immediately exploding after this action is completed if any creatures are in its area\.$/,
    /^At the end of each turn that you Sustain the Spell, you can choose to increase the size of the burst by (\d+) feet, up to a maximum of a (\d+)-foot burst\.$/];
const AID = [/^For the duration of the spell, allies within (\d+) feet of your mystic bomb can attempt to @UUID\[[^\]]+\]\{Aid\} you by lending their strength and making an Athletics or Arcana check at a standard DC of your level\.$/,
    /^If they succeed, they increase the number of damage dice the spell deals by 1d\d+, or by (\d)d\d+ if they critically succeed\.$/,
    /^After an ally successfully Aids you in this way, they cannot Aid you again and you can only receive Aid for this spell (\d+) times before further attempts automatically fail, treating critical successes as (\d) times for the purposes of attempts\.$/];
const STRIKE = /^(If you have @UUID\[[^\]]+\]\{Expansive Spellstrike\}, you can deliver your mystic bomb through a Spellstrike, moving the mystic bomb up to (\d+) feet as part of this activity and applying the effects as if you had Cast the Spell the same turn\.)$/;
const STEP = /^Heightened \(\+1\)\s*The initial damage increases by 1d(\d+) and the number of times your spell can receive Aid increases by (\d)\.$/;

/** {bomb, sentences} or null. */
export function extractMysticBomb(item) {
    const area = item?.system?.area, save = item?.system?.defense?.save;
    if (area?.type !== "burst" || !save?.basic || !item.system?.duration?.sustained) return null;
    const [body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const lead = htmlToPlainText(paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/), aid = (paragraphs[1] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const found = TEXT.map((pattern, index) => pattern.exec(lead[index + 1] ?? "")), aids = AID.map((pattern, index) => pattern.exec(aid[index] ?? "")), strike = STRIKE.exec(paragraphs[2] ?? "");
    const step = STEP.exec(htmlToPlainText(String(/<p>([\s\S]*?)<\/p>/.exec(heightened)?.[1] ?? "")).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 3 || lead.length !== TEXT.length + 1 || NARRATION_RULES.test(lead[0]) || found.some(match => !match) || aid.length !== 3 || aids.some(match => !match) || !strike || !step
        || found[0][3].toLowerCase() !== save.statistic || step[1] !== found[0][2]) return null;
    return {
        bomb: { dice: Number(found[0][1]), die: Number(found[0][2]), statistic: save.statistic, radius: Number(area.value), grow: { feet: Number(found[4][1]), max: Number(found[4][2]) },
            aid: { range: Number(aids[0][1]), critical: Number(aids[1][1]), uses: Number(aids[2][1]), critCounts: Number(aids[2][2]), skills: ["athletics", "arcana"] },
            step: { dice: 1, uses: Number(step[2]) }, baseRank: Number(item.system?.level?.value ?? 1), seconds: /^(\d+) rounds?$/.test(String(item.system?.duration?.value ?? "")) ? Number(/^(\d+)/.exec(item.system.duration.value)[1]) * 6 : 60,
            notes: [htmlToPlainText(strike[1]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim()] },
        sentences: [...lead.slice(1), ...aid.map(sentence => htmlToPlainText(sentence)), htmlToPlainText(strike[1]), htmlToPlainText(heightened).trim()]
    };
}
