// A phantasmal character with a theme (Phantasmal Protagonist): "… The phantasm is Medium, … When you Cast the Spell, decide what theme the protagonist is,
// choosing from hero, ally, or villain. The protagonist appears in an unoccupied space within range, and the first time each round that you Sustain the Spell,
// you can direct the protagonist to Stride or take the action granted by its theme. The phantasmal protagonist has a speed of 25 feet and an AC of 22. Its
// saving throw modifiers, Perception modifier, and skill modifiers are +12. It has 90 HP." with "<strong>Hero</strong>: … attempt a melee Strike, using your
// spell attack roll … inflicting 4d6+6 mental damage on a hit." / "<strong>Ally</strong>: … grant an adjacent creature 4d4 temporary Hit Points, which last for 1
// round." / "<strong>Villain</strong>: … The target must succeed at a Will save or become {Off-Guard} ({Slowed 1} on a critical failure) until the end of your next
// turn." and "Heightened (+1) The protagonist's AC, saving throw modifiers, skill modifiers, and Perception modifier increases by 3, and its HP increase by 30. A
// heroic protagonist's damage increases by 1d6. An ally protagonist's temporary Hit Points granted increases by 1d4." — the protagonist a token with those
// statistics at the cast rank (the theme picked on the card), while the caster Sustains; its thematic action the card's control (once a round): the hero's
// attack, the ally's temporary Hit Points, the villain's Will save.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = [/^You create a phantasmal incarnation of a significant character from [a-z ,]+\.$/,
    /^The phantasm is (Small|Medium|Large), regardless of the size of the character as it was described in the inspirational work\.$/,
    /^When you Cast the Spell, decide what theme the protagonist is, choosing from hero, ally, or villain\.$/,
    /^The protagonist appears in an unoccupied space within range, and the first time each round that you Sustain the Spell, you can direct the protagonist to Stride or take the action granted by its theme\.$/,
    /^The phantasmal protagonist has a speed of (\d+) feet and an AC of (\d+)\.$/, /^Its saving throw modifiers, Perception modifier, and skill modifiers are \+(\d+)\.$/, /^It has (\d+) HP\.$/];
const HERO = /^The protagonist takes the form of a legendary hero\. Its thematic action is to attempt a melee Strike, using your spell attack roll to make the attack and inflicting (\d+)d(\d+)\+(\d+) ([a-z]+) damage on a hit\.$/;
const ALLY = /^The protagonist takes the form of a recognizable support character\. Its thematic action is to grant an adjacent creature (\d+)d(\d+) temporary Hit Points, which last for (\d+) rounds?\.$/;
const VILLAIN = /^The protagonist takes the form of a notorious villain\. Its thematic action is to harry and mock an adjacent target\. The target must succeed at a (Will|Fortitude|Reflex) save or become (@UUID\[[^\]]+\]\{Off-Guard\}) \((@UUID\[[^\]]+\]\{Slowed 1\}) on a critical failure\) until the end of your next turn\.$/;
const STEP = /^Heightened \(\+(\d)\) The protagonist's AC, saving throw modifiers, skill modifiers, and Perception modifier increases by (\d+), and its HP increase by (\d+)\. A heroic protagonist's damage increases by (\d+)d(\d+)\. An ally protagonist's temporary Hit Points granted increases by (\d+)d(\d+)\.$/;
const SIZES = { Small: "sm", Medium: "med", Large: "lg" };

/** {protagonist, claimed} or null. */
export function compileProtagonist(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim()).filter(text => !/^@UUID\[[^\]]+\]\{[^}]+\}$/.test(text));
    if (!minutes || rest.length || paragraphs.length !== 4) return null;
    const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
    const sentences = plain(paragraphs[0]).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const theme = name => { const match = new RegExp(String.raw`^<strong>${name}<\/strong>:\s*([\s\S]*)$`).exec(paragraphs.find(text => text.startsWith(`<strong>${name}</strong>`)) ?? ""); return match ? match[1] : null; };
    const hero = HERO.exec(plain(theme("Hero") ?? "")), ally = ALLY.exec(plain(theme("Ally") ?? "")), villain = VILLAIN.exec(htmlToPlainText(theme("Villain") ?? "").replace(/\s+/g, " ").trim());
    const step = STEP.exec(plain(heightened));
    if (!hero || !ally || !villain || !step || step[5] !== hero[2] || step[7] !== ally[2]) return null;
    const [, speed, ac] = LEAD[4].exec(sentences[4]);
    return { protagonist: { size: SIZES[LEAD[1].exec(sentences[1])[1]], speed: Number(speed), ac: Number(ac), modifier: Number(LEAD[5].exec(sentences[5])[1]), hp: Number(LEAD[6].exec(sentences[6])[1]),
            seconds: Number(minutes[1]) * 60, step: { interval: Number(step[1]), stat: Number(step[2]), hp: Number(step[3]) },
            hero: { dice: Number(hero[1]), faces: Number(hero[2]), bonus: Number(hero[3]), type: hero[4], step: Number(step[4]) },
            ally: { dice: Number(ally[1]), faces: Number(ally[2]), rounds: Number(ally[3]), step: Number(step[6]) },
            villain: { statistic: villain[1].toLowerCase(), failure: villain[2], criticalFailure: villain[3] } },
        claimed: [...sentences, plain(theme("Hero")), plain(theme("Ally")), plain(theme("Villain")), step[0]] };
}

/** The protagonist's numbers at a cast rank. */
export function protagonistAt(data, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval));
    return { ac: data.ac + steps * data.step.stat, modifier: data.modifier + steps * data.step.stat, hp: data.hp + steps * data.step.hp,
        heroDice: data.hero.dice + steps * data.hero.step, allyDice: data.ally.dice + steps * data.ally.step };
}
