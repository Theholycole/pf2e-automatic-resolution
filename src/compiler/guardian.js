// A sustained spirit guardian that attacks or protects (Spiritual Guardian): "A Medium guardian made of magical force appears in an unoccupied space in range. …" /
// "… The guardian doesn't have any other attributes a creature would normally have, aside from 50 Hit Points that it can't recover by any means and that it can
// lose only when protecting a creature (see below)." / "When you Cast the Spell and each time you Sustain it, you can have the guardian move to any unoccupied
// space within 120 feet of you and either attack or protect." with "Attack The guardian makes a melee spell attack against an adjacent creature, dealing 3d8
// damage on a hit (or double damage on a critical hit). The damage type is the same as the chosen weapon (or any of its types for a versatile weapon). The attack
// deals spirit damage instead if that would be more detrimental to the creature (as determined by the GM). This attack uses and contributes to your multiple attack
// penalty." / "Protect … Each time the chosen creature would take damage and the guardian is adjacent to it, the guardian takes the first 10 damage instead of the
// ally. This protection lasts until you command the guardian to attack or to protect a different creature, or the guardian is destroyed." and "Heightened (+2) The
// guardian's damage increases by 1d8, and its Hit Points increase by 20." — the guardian a token with its Hit Points at the cast rank, removed with the caster's
// sustained Effect; the card's Attack (the caster's spell attack against a creature adjacent to it, the multiple attack penalty the button's, the type picked) and
// Protect (the chosen creature's marker: damage it takes beside the guardian, up to the stated amount, comes off the guardian's Hit Points instead).
import { htmlToPlainText } from "./description-parser.js";

const NOTES = [/^The [a-z ]+ is translucent and wields a ghostly echo of one weapon you're wielding or wearing\.$/, /^If you have a deity, the guardian takes the form of one of your deity's attendants or servitors\.$/,
    /^If you sanctify the spell, the guardian's attacks are sanctified as well\.$/, /^Creatures can move through the guardian's space but can't end their movement in it\.$/, /^You and your allies can flank with the guardian\.$/];
const APPEAR = /^An? (Medium|Large|Small) guardian made of magical force appears in an unoccupied space in range\.$/;
const HP = /^The guardian doesn't have any other attributes a creature would normally have, aside from (\d+) Hit Points that it can't recover by any means and that it can lose only when protecting a creature \(see below\)\.$/;
const MOVE = /^When you Cast the Spell and each time you Sustain it, you can have the guardian move to any unoccupied space within (\d+) feet of you and either attack or protect\.$/;
const ATTACK = [/^The guardian makes a melee spell attack against an adjacent creature, dealing (\d+)d(\d+) damage on a hit \(or double damage on a critical hit\)\.$/,
    /^The damage type is the same as the chosen weapon \(or any of its types for a versatile weapon\)\.$/, /^The attack deals ([a-z]+) damage instead if that would be more detrimental to the creature \(as determined by the GM\)\.$/,
    /^This attack uses and contributes to your multiple attack penalty\.$/];
const PROTECT = [/^The guardian protects a creature of your choice\.$/, /^Each time the chosen creature would take damage and the guardian is adjacent to it, the guardian takes the first (\d+) damage instead of the ally\.$/,
    /^This protection lasts until you command the guardian to attack or to protect a different creature, or the guardian is destroyed\.$/];
const STEP = /^Heightened \(\+(\d)\) The guardian's damage increases by (\d+)d(\d+), and its Hit Points increase by (\d+)\.$/;

/** {guardian, claimed} or null. */
export function compileGuardian(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const list = /<ul>([\s\S]*?)<\/ul>/.exec(body);
    if (!minutes || rest.length || !list) return null;
    const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z])/).filter(Boolean);
    const sentences = split(body.replace(list[0], ""));
    let appear = null, hp = null, move = null;
    const notes = [];
    for (const sentence of sentences) {
        if (!appear && APPEAR.test(sentence)) { appear = APPEAR.exec(sentence); continue; }
        if (!hp && HP.test(sentence)) { hp = HP.exec(sentence); continue; }
        if (!move && MOVE.test(sentence)) { move = MOVE.exec(sentence); continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        return null;
    }
    const items = Object.fromEntries([...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)].map(match => [match[1].trim(), split(match[2])]));
    const match = (lines, patterns) => lines?.length === patterns.length && patterns.every((pattern, index) => pattern.test(lines[index])) ? lines.map((line, index) => patterns[index].exec(line)) : null;
    const attack = match(items.Attack, ATTACK), protect = match(items.Protect, PROTECT);
    const stepText = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (!appear || !hp || !move || !attack || !protect || Object.keys(items).length !== 2 || (stepText && !step) || (step && step[3] !== attack[0][2])) return null;
    // (PF2e's damage entry is the dice; the text's type is the weapon's, or spirit.)
    const [entry, ...others] = adapted.damageComponents ?? [];
    if (others.length || (entry && String(entry.formula ?? "").replace(/\s+/g, "") !== `${attack[0][1]}d${attack[0][2]}`)) return null;
    return { guardian: { seconds: Number(minutes[1]) * 60, size: { Medium: "med", Large: "lg", Small: "sm" }[appear[1]], hp: Number(hp[1]), moveFeet: Number(move[1]),
            attack: { dice: Number(attack[0][1]), faces: Number(attack[0][2]), types: ["bludgeoning", "piercing", "slashing", attack[2][1]] }, absorb: Number(protect[1][1]),
            step: step ? { interval: Number(step[1]), dice: Number(step[2]), hp: Number(step[4]) } : null, notes },
        claimed: [...sentences, ...items.Attack, ...items.Protect, ...(step ? [stepText] : [])] };
}

/** The guardian's Hit Points and dice at a cast rank. */
export function guardianAt(data, castRank, baseRank) {
    const steps = data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) : 0;
    return { hp: data.hp + steps * (data.step?.hp ?? 0), dice: data.attack.dice + steps * (data.step?.dice ?? 0) };
}
