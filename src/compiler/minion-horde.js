// A horde of trivial conjured creatures that damage adjacent enemies automatically (Horde of Underlings; conjured creatures are tokens, user decision
// 2026-10-01): "You summon six underlings, such as skeletons or kobolds." / "When you cast this spell, you decide what kind of creatures they are, if
// they're Small or Medium, and whether they deal bludgeoning, piercing, or slashing damage (choose once and applying it to all underlings)." / "Each
// underling has 1 Hit Point, 5 AC, and automatically fails all saving throws." / "Each underling appears in an unoccupied square of your choice
// within the area." / "The underlings don't block movement, but they are difficult terrain for creatures other than you." / "Each underling
// attacks one enemy adjacent to it (if any), automatically dealing 1d4 damage of the chosen type." / "The first time you Sustain the spell on each
// subsequent round, each underling moves 20 feet toward the nearest enemy." / "If an underling ends its movement adjacent to an enemy, it damages
// that enemy as described above." with "Heightened (+1) The number of underlings increases by 2" — the underlings are tokens of one actor (the
// stated AC and Hit Points, saves that fail), made in free squares near the caster; when cast and on the first Sustain each later round (the
// card's control) each moves up to the stated distance toward the nearest enemy and deals the damage to an adjacent one. Their kind, their place
// in the area and the difficult terrain are notes.
import { htmlToPlainText } from "./description-parser.js";
import { unlinkText } from "./text-patterns.js";

const NUMBERS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const HORDE = {
    summon: /^You summon (two|three|four|five|six|seven|eight|nine|ten) ([a-z]+), such as [a-z, ]+\.$/,
    choose: /^When you cast this spell, you decide what kind of creatures they are, if they're (Small) or (Medium), and whether they deal (bludgeoning), (piercing), or (slashing) damage \(choose once and applying it to all [a-z]+\)\.$/,
    stats: /^Each [a-z]+ has (\d+) Hit Points?, (\d+) AC, and automatically fails all saving throws\.$/,
    appear: /^Each [a-z]+ appears in an unoccupied square of your choice within the area\.$/,
    terrain: /^The [a-z]+ don't block movement, but they are difficult terrain for creatures other than you\.$/,
    attack: /^Each [a-z]+ attacks one enemy adjacent to it \(if any\), automatically dealing (\d+d\d+) damage of the chosen type\.$/,
    move: /^The first time you Sustain the spell on each subsequent round, each [a-z]+ moves (\d+) feet toward the nearest enemy\.$/,
    again: /^If an? [a-z]+ ends its movement adjacent to an enemy, it damages that enemy as described above\.$/
};
const STEP = /^Heightened \(\+(\d)\) The number of [a-z]+ increases by (\d+)\.?$/;

/** Returns {minionHorde, claimed} or null. */
export function compileMinionHorde(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || components.length !== 1 || components[0].category) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== Object.keys(HORDE).length) return null;
    const claimed = Object.fromEntries(Object.entries(HORDE).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const heightened = htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim();
    const step = STEP.exec(heightened);
    if (heightened && !step) return null;
    const [, count, name] = HORDE.summon.exec(claimed.summon), [, hp, ac] = HORDE.stats.exec(claimed.stats), [, dice] = HORDE.attack.exec(claimed.attack);
    if (dice !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const choose = HORDE.choose.exec(claimed.choose);
    return { minionHorde: { name, count: NUMBERS[count], step: step ? { interval: Number(step[1]), count: Number(step[2]) } : null, hp: Number(hp), ac: Number(ac), savesFail: true,
        sizes: [choose[1].toLowerCase(), choose[2].toLowerCase()], types: [choose[3], choose[4], choose[5]], formula: dice, moveFeet: Number(HORDE.move.exec(claimed.move)[1]),
        rangeFeet: Number(adapted.targeting.area.value) || 30, seconds: Number(minutes[1]) * 60,
        notes: [`Choose what kind of creatures the ${name} are.`, `Move them to unoccupied squares of your choice within the area.`, unlinkText(claimed.terrain)] },
        claimed: [...sentences, heightened].filter(Boolean) };
}

/** The number of minions at a cast rank. */
export function hordeCount(data, castRank, baseRank) {
    return data.count + (data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) * data.step.count : 0);
}
