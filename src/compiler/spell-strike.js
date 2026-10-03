// Spells whose effect is a Strike (note-only before): Shielding Strike, Spinning Staff, Dimensional Assault, Sky Laughs at Waves, Shooting Star.
// Casting checks the weapon requirement, performs a stated first action (Raise a Shield), and posts a card whose buttons roll PF2e's own Strike
// with each eligible weapon (a second Strike at the next multiple attack penalty). Movement (teleport, fly) is the player's; other riders
// (cover reduction, falling, disruption) are notes.
import { htmlToPlainText } from "./description-parser.js";

const FORMS = [
    { key: "shielding", strike: /^Then, make a melee Strike\.$/, before: /^You can either (?:@UUID\[[^\]]+\]\{Raise a Shield\}|Raise a Shield) if you're wielding one or cast (?:@UUID\[[^\]]+\]\{Shield\}|Shield) if you have the spell\.$/,
        data: { range: "melee", count: 1, preAction: "raise-a-shield" } },
    { key: "spinning", requirement: /^Requirements You're wielding a staff\.$/, strike: /^Make a melee Strike with your staff against one foe and then a second melee Strike with your staff against a different foe\.$/,
        after: [/^Your multiple attack penalty applies to both of these attacks as normal\.$/], data: { range: "melee", count: 2, weapon: { baseItem: "staff" }, differentTargets: true } },
    { key: "dimensional", strike: /^Teleport to any space in range you can see that's within reach of an enemy, and then make a melee Strike against that enemy\.$/,
        after: [/^If you attempt to bring another creature with you when you teleport—even if you're carrying it in an extradimensional container—the spell is disrupted\.$/], data: { range: "melee", count: 1, movement: "teleport" } },
    { key: "sky", requirement: /^Requirements You're wielding a one-handed weapon in the sword group\.$/, strike: /^Fly up to your Speed, then make a Strike with your sword against an adjacent creature at the end of your movement\.$/,
        after: [/^If you don't have any other means of flying, you fall after the Strike\.$/, /^If you can't end your movement adjacent to an enemy, this spell is disrupted\.$/], data: { range: "melee", count: 1, weapon: { group: "sword", hands: 1 }, movement: "fly" } },
    { key: "star", requirement: /^Requirements You're wielding a ranged weapon or a thrown weapon\.$/, strike: /^Make a ranged Strike, ignoring the target's (?:@UUID\[[^\]]+\]\{Concealment\}|Concealment) and reducing the target's cover by one degree for only this Strike \(greater to standard, standard to lesser, and lesser to none\)\.$/,
        after: [/^If the Strike hits, the meteor trail hangs in the air\.$/, /^This gives the benefits of concealment negation and cover reduction to any attacks made against the creature \(by anyone\) until the start of your next turn\.$/],
        data: { range: "ranged", count: 1, weapon: { rangedOrThrown: true } } },
    // Tracking Mayflies: "Make a ranged Strike." with the doubled range increment (a note), Off-Guard against a target under a spell or with a magic item (the
    // GM's answer on the card, for this Strike), the invisible-or-concealed rules (notes), and Dazzled for 1 round on a successful Strike.
    { key: "mayflies", strike: /^Make a ranged Strike\.$/,
        after: [/^For this Strike, double your weapon's range increment\.$/,
            /^If the target is under the effect of a spell, is wielding a magic item, or is wearing a magic item, it's (?:@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Off-Guard\}|off-guard) against this Strike, as [^.]+\.$/,
            /^If the target was invisible, the target becomes (?:@UUID\[[^\]]+\]\{Concealed\}|concealed) to this Strike instead\.$/,
            /^If the target was already concealed for any other reason, it's no longer concealed to this Strike\.$/,
            /^If the Strike is successful, the target is (?:@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Dazzled\}|dazzled) for 1 round as [^.]+\.$/],
        data: { range: "ranged", count: 1, weapon: { rangedOrThrown: true },
            offGuardQuestion: { question: "Is the target under the effect of a spell, or wielding or wearing a magic item?", uuid: "Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg" },
            hitCondition: { slug: "dazzled", uuid: "Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh", rounds: 1 } } },
    // Tentacular Innervation: "Make an unarmed melee Strike." with the extra reach (a note), "If the Strike hits, …, the target becomes {Sickened 1} and is {Grabbed}
    // by the mass of tentacles." (Sickened 1; Grabbed for the spell's minute — an Escape against the spell DC ends the spell, the GM's), the grab's limits and the
    // tentacles' statistics (notes).
    { key: "tentacles", duration: /^1 minute$/, strike: /^Make an unarmed melee Strike\.$/,
        after: [/^Your reach increases by (\d+) feet for this Strike\.$/,
            /^If the Strike hits, in addition to dealing its normal damage, the target becomes @UUID\[Compendium\.pf2e\.conditionitems\.Item\.fesd1n5eVhpCSS18\]\{Sickened 1\} and is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.kWc1fhmv9LBiTuei\]\{Grabbed\} by the mass of tentacles\.$/,
            /^The target isn't @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}, but it can't move beyond the reach of the unarmed melee Strike that has grabbed it\.$/,
            /^If the target (?:\[\[\/act escape\]\]\{Escapes\}|Escapes) from the mass of tentacles \(using your spell DC as the Escape DC\), the spell ends\.$/,
            /^The mass of tentacles can be severed before the spell's duration ends; it has AC (\d+) and (\d+) Hit Points, and it's immune to critical hits and precision damage\.$/],
        heightened: /^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*The Hit Points of the tentacles increases by \d+\.\s*<\/p>$/,
        data: { range: "melee", count: 1, unarmed: true,
            hitConditions: [{ slug: "sickened", uuid: "Compendium.pf2e.conditionitems.Item.fesd1n5eVhpCSS18", value: 1 },
                { slug: "grabbed", uuid: "Compendium.pf2e.conditionitems.Item.kWc1fhmv9LBiTuei", minutes: 1, escapeEnds: true }] } }
];
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC|Strikes?)\b/i;

/** Returns {spellStrike, claimed} or null. */
export function compileSpellStrike(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const duration = String(adapted.lifecycle?.duration ?? "").trim();
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    const text = htmlToPlainText([body, ...rest.filter(section => !/Heightened/.test(section))].join(" ")).replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    for (const form of FORMS) {
        const strikeAt = sentences.findIndex(sentence => form.strike.test(sentence));
        if (strikeAt < 0 || (form.duration ? !form.duration.test(duration) : duration)) continue;
        let index = 0;
        if (form.requirement) { if (!form.requirement.test(sentences[0] ?? "")) continue; index = 1; }
        const beforeAt = form.before ? sentences.findIndex(sentence => form.before.test(sentence)) : -1;
        if (form.before && beforeAt !== strikeAt - 1) continue;
        const narration = sentences.slice(index, form.before ? beforeAt : strikeAt);
        // (A magus spell's narration names the Spellstrike it charges: that recharge is a note.)
        const charges = narration.some(sentence => /\bto charge for your next @UUID\[[^\]]+\]\{Spellstrike\}/.test(sentence));
        if (narration.length > 2 || narration.some(sentence => NARRATION_RULES.test(sentence.replace(/@UUID\[[^\]]+\]\{Spellstrike\}/, "Spellstrike")))) continue;
        const after = sentences.slice(strikeAt + 1);
        if (after.length !== (form.after ?? []).length || after.some((sentence, i) => !form.after[i].test(sentence))) continue;
        // Heightened entries: only the range (Dimensional Assault).
        if (rest.some(section => /Heightened/.test(section) && !/^<p>\s*<strong>\s*Heightened \(\d+(?:st|nd|rd|th)\)\s*<\/strong>\s*The range is equal to your Speed\.\s*<\/p>$/.test(section)
            && !(form.heightened && form.heightened.test(section)))) continue;
        return { spellStrike: { ...structuredClone(form.data), form: form.key, notes: [...after.map(sentence => sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")),
            ...(charges ? ["This charges your next Spellstrike (mark it as recharged)."] : [])] }, claimed: sentences };
    }
    return null;
}

/** Whether a PF2e weapon (its traits, group, base item, range, hands) meets the spell's requirement. */
export function weaponQualifies(requirement, weapon) {
    if (!requirement) return true;
    if (requirement.baseItem && weapon.baseItem !== requirement.baseItem && !(weapon.group === "club" && /staff/i.test(weapon.name ?? ""))) return false;
    if (requirement.group && weapon.group !== requirement.group) return false;
    if (requirement.hands && Number(weapon.hands ?? 1) !== requirement.hands) return false;
    if (requirement.rangedOrThrown && !(weapon.ranged || weapon.thrown)) return false;
    return true;
}
