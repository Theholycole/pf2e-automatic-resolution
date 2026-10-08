// Conjured weapons for willing creatures, with runes by rank and a fixed damage type (Blazing Armory):
//   "You materialize a flaming simulacrum of any common simple or martial weapon into the target's grasp." / "The target must have a free hand to
//   hold the weapon, or else the weapon falls to the ground in the target's space." / "The blazing weapon functions as a +1 striking weapon, and
//   its damage type changes to fire." / "The damage type can't be changed using the versatile trait, modular trait, or similar methods." with the
//   thrown and ammunition sentences, "Any creature other than you or the target that attempts to touch, make a Strike with, or Disarm the weapon
//   takes @Damage[1d6[fire]] damage each time." and "Heightened (4th) You can target up to 5 willing creatures and can choose a different weapon
//   for each target. The weapons function as +1 striking flaming weapons." (and 6th, 8th, 10th: their runes).
// Each target gets the chosen weapon (a common simple or martial weapon from the Item compendiums) for the duration: held when it has a free
// hand (else dropped), its damage fire and its versatile and modular traits removed, with the rank's runes. The card's button deals the touch
// damage to the creature the GM targets.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const STRIKING = { striking: 1, "greater striking": 2, "major striking": 3 };
const PROPERTY = { flaming: "flaming", "greater flaming": "greaterFlaming" };
const RUNES = /\+(\d) (striking|greater striking|major striking)(?: (flaming|greater flaming))? weapons?/;
const SENTENCES = [
    /^You materialize an? [a-z ]+ simulacrum of any (common) (simple or martial) weapon into the target's grasp\.$/,
    /^The target must have a free hand to hold the weapon, or else the weapon falls to the ground in the target's space\.$/,
    /^The [a-z]+ weapon functions as an? \+(\d) (striking|greater striking|major striking) weapon, and its damage type changes to ([a-z]+)\.$/,
    /^The damage type can't be changed using the versatile trait, modular trait, or similar methods\.$/,
    /^A thrown weapon rematerializes in the target's hand after the Strike is complete\.$/,
    /^If you choose a ranged weapon that uses ammunition, the wielder must still reload the weapon using the normal number of actions, though this generates ammunition automatically; this functions as normal ammunition, and the [a-z]+ weapon can't use other types of ammunition\.$/,
    /^Any creature other than you or the target that attempts to touch, make a Strike with, or (?:@UUID\[[^\]]+\]\{Disarm\}|Disarm) the weapon takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage each time\.$/
];

/** Returns {conjuredWeapons, claimed} or null. */
export function compileConjuredWeapons(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!minutes || adapted.lifecycle?.sustained) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").replace(/<\/?em>/g, "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => SENTENCES[0].test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + SENTENCES.length || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const found = SENTENCES.map((pattern, index) => pattern.exec(sentences[at + index]));
    if (found.some(match => !match)) return null;
    const runes = [{ minRank: Number(adapted.rank), potency: Number(found[2][1]), striking: STRIKING[found[2][2]], property: [] }];
    let targets = [{ minRank: Number(adapted.rank), limit: 1 }];
    const entries = [...rest[0].matchAll(/<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)<\/p>/gi)].map(match => ({ rank: Number(match[1]), text: htmlToPlainText(match[2]).replace(/\s+/g, " ").trim() }));
    if (!entries.length || rest[0].replace(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi, "").trim()) return null;
    for (const [index, entry] of entries.entries()) {
        const first = /^You can target up to (\d+) willing creatures and can choose a different weapon for each target\. The weapons function as (.+)\.$/.exec(entry.text);
        const later = /^As (\d+)(?:st|nd|rd|th), but the weapons function as (.+)\.$/.exec(entry.text);
        if (index === 0 ? !first : !later || Number(later[1]) !== entries[0].rank) return null;
        if (first) targets.push({ minRank: entry.rank, limit: Number(first[1]) });
        const rune = RUNES.exec(index === 0 ? first[2] : later[2]);
        if (!rune || rune[0].length !== (index === 0 ? first[2] : later[2]).length) return null;
        runes.push({ minRank: entry.rank, potency: Number(rune[1]), striking: STRIKING[rune[2]], property: rune[3] ? [PROPERTY[rune[3]]] : [] });
    }
    return {
        conjuredWeapons: { rarity: found[0][1], categories: found[0][2].split(" or "), damageType: found[2][3], lockType: true, durationSeconds: Number(minutes[1]) * 60,
            runes, targets, touch: { formula: found[6][1], type: found[6][2] }, notes: [sentences[at + 1], sentences[at + 4], sentences[at + 5]] },
        claimed: [...sentences.slice(at), ...entries.map(entry => entry.text)]
    };
}

/** The runes and the target limit at a cast rank. */
export function conjuredWeaponsAt(data, castRank) {
    const at = list => list.filter(entry => Number(castRank) >= entry.minRank).at(-1) ?? list[0];
    return { runes: at(data.runes), limit: at(data.targets).limit };
}
