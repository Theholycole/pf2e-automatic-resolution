// Note-only spells whose stated rules map to PF2e rule elements (Song of Marching, Share Lore, Tentacular Limbs).
import { plainText as plain, splitSentences as split } from "./description-parser.js";


// Song of Marching: "You and your allies in the area can Hustle for the spell's duration … You and your allies then become temporarily immune for
// 1 day. If you enter an encounter while performing this song, you can use your Performance modifier for the initiative roll. You and your
// affected allies also receive a +1 status bonus to that initiative roll." — an Effect on the caster and each ally in the emanation: +1 status
// to initiative; the caster's also offers its Performance for initiative (a toggle); they're immune for 1 day after it ends. Hustling is a note.
const HUSTLE = /^You and your allies in the area can (?:@UUID\[[^\]]+\]\{Hustle\}|Hustle) for the spell's duration, in addition to your other exploration activities \(your exploration activity is Sustaining this spell\)\.$/;
const MARCH_IMMUNE = /^You and your allies then become temporarily immune for (\d+) days?\.$/;
const PERFORMANCE_INIT = /^If you enter an encounter while performing this song, you can use your Performance modifier for the initiative roll\.$/;
const INIT_BONUS = /^You and your affected allies also receive a \+(\d) status bonus to that initiative roll\.$/;
export function compileMarchingSong(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || area?.type !== "emanation") return null;
    const hours = /^(\d+) hours?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    if (!hours || sentences.length !== 5 || /\d|@/.test(sentences[0]) || !HUSTLE.test(sentences[1]) || !MARCH_IMMUNE.test(sentences[2]) || !PERFORMANCE_INIT.test(sentences[3]) || !INIT_BONUS.test(sentences[4])) return null;
    if (rest.some(section => !/Heightened \(\d+(?:st|nd|rd|th)\) You can Sustain the Spell for up to \d+ hours\./.test(plain(section)))) return null;
    return { marchingSong: { radius: Number(area.value), durationSeconds: Number(hours[1]) * 3600, initiative: { type: "status", value: Number(INIT_BONUS.exec(sentences[4])[1]) },
        casterStatistic: "performance", immunityDays: Number(MARCH_IMMUNE.exec(sentences[2])[1]), notes: [sentences[1]] }, claimed: [...sentences, ...rest.map(plain)] };
}

// Share Lore: "Choose one Lore skill in which you're trained. The targets become trained in that Lore skill for the duration of the spell." with
// Heightened (3rd) 1 hour and five targets, (5th) 8 hours, five targets and two Lores — a trained Lore item on each target for the duration,
// removed with the spell's Effect.
const LORE_CHOICE = /^Choose (one|two) Lore skills? in which you're trained\.$/;
const LORE_TRAINED = /^The targets become trained in that Lore skill for the duration of the spell\.$/;
export function compileSharedLore(adapted) {
    const targets = /^up to (\d+) creatures$/i.exec(String(adapted.targeting?.target ?? "").trim());
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (adapted.defense?.kind !== "none" || !targets || !minutes) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    const at = sentences.findIndex(sentence => LORE_CHOICE.test(sentence));
    if (at < 0 || sentences.length !== at + 2 || !LORE_TRAINED.test(sentences[at + 1]) || sentences.slice(0, at).some(sentence => /\d|@/.test(sentence))) return null;
    const steps = [];
    for (const match of plain(rest.join(" ")).matchAll(/Heightened \((\d+)(?:st|nd|rd|th)\) The duration of the spell is (\d+) hours?, (?:and )?you can target up to (\w+) creatures(?:, and you can share up to (\w+) Lore skills in which you're trained)?\./g))
        steps.push({ rank: Number(match[1]), seconds: Number(match[2]) * 3600, targets: { five: 5, three: 3, ten: 10 }[match[3]] ?? Number(match[3]), lores: match[4] ? ({ two: 2, three: 3 }[match[4]] ?? Number(match[4])) : 1 });
    if (rest.length && steps.length !== plain(rest.join(" ")).split(/Heightened/).length - 1) return null;
    return { sharedLore: { base: { seconds: Number(minutes[1]) * 60, targets: Number(targets[1]), lores: 1 }, steps }, claimed: [...sentences, ...rest.map(plain)] };
}

/** Share Lore's targets, Lores and duration at a cast rank. */
export function sharedLoreAt(data, castRank) {
    return [...data.steps].filter(step => castRank >= step.rank).at(-1) ?? { ...data.base, rank: 1 };
}

// Tentacular Limbs: "Your arms turn into long, pliable tentacles, increasing your reach when you're delivering touch range spells and making
// unarmed Strikes with your arms (such as fist and claw Strikes) to 10 feet. This doesn't change the reach of your melee weapon attacks." —
// the caster's unarmed Strikes gain the reach trait (PF2e's AdjustStrike); touch spells' reach and the extra action are notes.
const TENTACLE = /^Your arms turn into long, pliable tentacles, increasing your reach when you're delivering touch range spells and making unarmed Strikes with your arms \(such as fist and claw Strikes\) to 10 feet\.$/;
export function compileUnarmedReach(adapted) {
    if (adapted.defense?.kind !== "none" || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const sentences = split(plain(body));
    if (!minutes || !TENTACLE.test(sentences[0] ?? "") || sentences[1] !== "This doesn't change the reach of your melee weapon attacks." || sentences.length !== 3
        || !/^During the duration, whenever you Cast a Spell, you can add an additional action to that spell's casting to temporarily extend your reach to 20 feet to deliver that spell\.$/.test(sentences[2])) return null;
    return { unarmedReach: { trait: "reach", durationSeconds: Number(minutes[1]) * 60, notes: ["Touch-range spells are delivered at 10 feet.", sentences[2], ...rest.map(plain)] }, claimed: [...sentences, ...rest.map(plain)] };
}
