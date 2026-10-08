// An illusory creature with statistics, its Strikes dealing believed damage (Illusory Creature; user decisions 2026-10-01: a conjured creature
// with stats is a token; disbelief is a Disbelieve control):
//   "You create an illusory image of a Large or smaller creature." / "If you and the image are ever farther than 500 feet apart, the spell ends." /
//   "In combat, the illusion can use 2 actions per turn, which it uses when you Sustain the spell." / "It uses your spell attack modifier for
//   attack rolls and your spell DC for its AC." / "Its saving throw modifiers are equal to your spell DC – 10." / "It is substantial enough that it
//   can flank other creatures." / "If the image is hit by an attack or fails a save, the spell ends." / "If the illusory creature hits with a
//   Strike, the target takes @Damage[3d4[mental]] damage." / "The illusion's Strikes are nonlethal." / "Any creature that touches the image or uses
//   the Seek action to examine it can attempt to disbelieve your illusion." / "When a creature disbelieves the illusion, it recovers from half the
//   damage it had taken from it (if any) and doesn't take any further damage from it." with the voice, the GM-judged checks and resistances (notes)
//   and "Heightened (+1) The damage of the image's Strikes increases by 1d4, and the maximum size of creature you can create increases by one (to a
//   maximum of Gargantuan)."
// A sustained record holds an NPC token beside the caster (AC the spell DC, saves DC − 10, the size chosen up to the rank's maximum). The card's
// Strike rolls the caster's spell attack against the target's AC: a hit deals the mental damage (nonlethal) unless the target disbelieved, and the
// damage is tracked; a hit on the image or a failed save by it ends the spell, as does its being more than 500 feet from the caster. The card's
// Disbelieve rolls a creature's Perception against the spell DC: a success heals half the damage it took from the image and makes it immune.
import { htmlToPlainText } from "./description-parser.js";

const SIZES = ["tiny", "sm", "med", "lg", "huge", "grg"];
const NAMES = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge", Gargantuan: "grg" };
const RULES = [
    /^You create an illusory image of an? (Tiny|Small|Medium|Large|Huge) or smaller creature\.$/,
    /^It generates the appropriate sounds, smells, and feels believable to the touch\.$/,
    /^If you and the image are ever farther than (\d+) feet apart, the spell ends\.$/,
    /^The image can't speak, but you can use your actions to speak through the creature, with the spell disguising your voice as appropriate\.$/,
    /^You might need to attempt a Deception or Performance check to mimic the creature, as determined by the GM\.$/,
    /^This is especially likely if you're trying to imitate a specific person and engage with someone that person knows\.$/,
    /^In combat, the illusion can use (\d) actions per turn, which it uses when you Sustain the spell\.$/,
    /^It uses your spell attack modifier for attack rolls and your spell DC for its AC\.$/,
    /^Its saving throw modifiers are equal to your spell DC [–−-] (\d+)\.$/,
    /^It is substantial enough that it can flank other creatures\.$/,
    /^If the image is hit by an attack or fails a save, the spell ends\.$/,
    /^The illusion can cause damage by making the target believe the illusion's attacks are real, but it cannot otherwise directly affect the physical world\.$/,
    /^If the illusory creature hits with a Strike, the target takes @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage\.$/,
    /^The illusion's Strikes are nonlethal\.$/,
    /^If the damage doesn't correspond to the image of the monster[—–-]for example, if an illusory Large dragon deals only 5 damage[—–-]the GM might allow the target to attempt an immediate Perception check to disbelieve the spell\.$/,
    /^Any relevant resistances and weaknesses apply if the target thinks they do, as judged by the GM\.$/,
    /^For example, if the illusion wields a warhammer and attacks a creature resistant to bludgeoning damage, the creature would take less mental damage\.$/,
    /^However, illusory damage does not deactivate regeneration or trigger other effects that require a certain damage type\.$/,
    /^The GM should track illusory damage dealt by the illusion\.$/,
    /^Any creature that touches the image or uses the (?:@UUID\[[^\]]+\]\{Seek\}|Seek) action to examine it can attempt to disbelieve your illusion\.$/,
    /^When a creature disbelieves the illusion, it recovers from half the damage it had taken from it \(if any\) and doesn't take any further damage from it\.$/
];
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage of the image's Strikes increases by (\d+)d(\d+), and the maximum size of creature you can create increases by one \(to a maximum of (Gargantuan|Huge)\)\.\s*<\/p>$/;

/** Returns {illusoryCreature, claimed} or null. */
export function compileIllusoryCreature(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.lifecycle?.sustained !== true || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (!(adapted.activation?.traits ?? []).includes("illusion")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== RULES.length) return null;
    const found = RULES.map((pattern, index) => pattern.exec(sentences[index]));
    if (found.some(match => !match)) return null;
    const step = STEP.exec(rest[0]);
    if (!step || step[3] !== found[12][2]) return null;
    return {
        illusoryCreature: {
            maxSize: NAMES[found[0][1]], sizeStep: { interval: Number(step[1]), cap: NAMES[step[4]] }, rangeFeet: Number(found[2][1]), actions: Number(found[6][1]), saveOffset: Number(found[8][1]),
            strike: { dice: Number(found[12][1]), faces: Number(found[12][2]), type: found[12][3], step: { interval: Number(step[1]), dice: Number(step[2]) }, nonlethal: true },
            disbelieve: { statistic: "perception", healHalf: true, immune: true },
            notes: [sentences[3], `${sentences[4]} ${sentences[5]}`, sentences[9], sentences[14], `${sentences[15]} ${sentences[16]} ${sentences[17]}`, sentences[19]]
        },
        claimed: [...sentences, htmlToPlainText(rest[0]).trim()]
    };
}

// Famed Figure (Witches+), the same image with a witch's twist: "You create an illusion of a creature from one of your stories. You create an illusory image of a
// Medium or smaller creature. … If you and the image are ever farther than 30 feet apart or you Cast this spell again, the spell ends." / "In combat, the illusion gains
// 2 actions per turn, which it uses when you Cast the spell or the first time you Sustain the spell on subsequent turns." / "If the illusory creature hits with a
// Strike, the target takes (1+rank)d4 mental damage if it was a melee spell attack roll or (rank)d4 mental damage if it was a ranged spell attack roll." / "The
// illusion's Strikes are nonlethal, its ranged attacks have a range of 30 feet, and if it makes more than one attack per turn, it takes a multiple attack penalty as
// if it were a creature." / "When a creature disbelieves the illusion or if the spell ends while the illusion is observed, it recovers from half the damage …" with
// "Heightened (+1) The damage of the image's melee and ranged Strikes increases by 1d4, and the maximum size …": the same token and card — its melee and ranged
// Strikes (the ranged one within 30 feet), the multiple attack penalty asked, the earlier image ended when it's cast again; the observers' recovery at the spell's
// end a note.
const FAMED = [
    /^You create an illusory image of an? (Tiny|Small|Medium|Large|Huge) or smaller creature\.$/,
    RULES[1],
    /^If you and the image are ever farther than (\d+) feet apart or you Cast this spell again, the spell ends\.$/,
    RULES[3], RULES[4], RULES[5],
    /^In combat, the illusion gains (\d) actions per turn, which it uses when you Cast the spell or the first time you Sustain the spell on subsequent turns\.$/,
    RULES[7], RULES[8], RULES[9], RULES[10], RULES[11],
    /^If the illusory creature hits with a Strike, the target takes @Damage\[\(1\+@item\.rank\)d(\d+)\[([a-z]+)\]\] damage if it was a melee spell attack roll or @Damage\[\(@item\.rank\)d\1\[\2\]\] damage if it was a ranged spell attack roll\.$/,
    /^The illusion's Strikes are nonlethal, its ranged attacks have a range of (\d+) feet, and if it makes more than one attack per turn, it takes a multiple attack penalty as if it were a creature\.$/,
    /^If the damage doesn't correspond to the image of the monster[—–-]for example, if an illusory dragon deals only 5 damage[—–-]the GM might allow the target to attempt an immediate Perception check to disbelieve the spell\.$/,
    RULES[15], RULES[16], RULES[17], RULES[18], RULES[19],
    /^When a creature disbelieves the illusion or if the spell ends while the illusion is observed, it recovers from half the damage it had taken from it \(if any\) and doesn't take any further damage from it\.$/
];
const FAMED_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage of the image's melee and ranged Strikes increases by (\d+)d(\d+), and the maximum size of the creature you can create increases by one \(to a maximum of (Gargantuan|Huge)\)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;

/** Famed Figure: {illusoryCreature, claimed} or null. */
export function compileFamedFigure(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.lifecycle?.sustained !== true || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (!(adapted.activation?.traits ?? []).includes("illusion")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== FAMED.length + 1 || NARRATION_RULES.test(sentences[0])) return null;
    const found = FAMED.map((pattern, index) => pattern.exec(sentences[index + 1]));
    if (found.some(match => !match)) return null;
    const step = FAMED_STEP.exec(rest[0]);
    if (!step || step[3] !== found[12][1] || Number(step[2]) !== 1 || Number(step[1]) !== 1) return null;
    const rank = Number(adapted.rank) || 1;
    return {
        illusoryCreature: {
            maxSize: NAMES[found[0][1]], sizeStep: { interval: Number(step[1]), cap: NAMES[step[4]] }, rangeFeet: Number(found[2][1]), actions: Number(found[6][1]), saveOffset: Number(found[8][1]),
            strike: { dice: 1 + rank, faces: Number(found[12][1]), type: found[12][2], step: { interval: 1, dice: 1 }, nonlethal: true, ranged: { dice: rank, rangeFeet: Number(found[13][1]) } },
            map: true, endsOnRecast: true,
            disbelieve: { statistic: "perception", healHalf: true, immune: true },
            notes: [sentences[4], `${sentences[5]} ${sentences[6]}`, sentences[7], sentences[10], sentences[15], `${sentences[16]} ${sentences[17]} ${sentences[18]}`, sentences[20], sentences[21]]
        },
        claimed: [...sentences, htmlToPlainText(rest[0]).trim()]
    };
}

/** The image's maximum size and its Strike's dice at a cast rank. */
export function illusoryAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.strike.step.interval));
    const size = SIZES[Math.min(SIZES.indexOf(data.maxSize) + Math.floor((Number(castRank) - Number(baseRank)) / data.sizeStep.interval), SIZES.indexOf(data.sizeStep.cap))];
    return { maxSize: size, formula: `${data.strike.dice + steps * data.strike.step.dice}d${data.strike.faces}`,
        // (Famed Figure's ranged Strike: its own dice, grown alike.)
        ...(data.strike.ranged ? { rangedFormula: `${data.strike.ranged.dice + steps * data.strike.step.dice}d${data.strike.faces}` } : {}) };
}
