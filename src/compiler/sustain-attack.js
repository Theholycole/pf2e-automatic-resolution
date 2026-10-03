// A spell whose Sustain makes its attack (Dancing Blade, Spirit Object): an animated weapon or object that attacks with your spell
// attack modifier when you cast it (Dancing Blade) and each time you Sustain it (or, for an object, when you command it to Strike),
// dealing damage of the weapon's or object's physical type:
//   Dancing Blade: "When you first Cast the Spell, the weapon automatically flies to the target and Strikes. … Each time you Sustain the
//   Spell, the weapon either Changes Partners or Strikes. …" / "Strike (attack) The weapon attacks its target using your spell attack
//   modifier. On a hit, the weapon deals 3d6 damage, of a type determined by the weapon (… you choose each time you attack)."
//   Spirit Object: "… Once per round, you can Sustain the spell to command the object further, either prompting it to move again or to
//   Strike. … Make a melee spell attack roll against the creature. On a success, the creature takes 2d4 damage. The damage is either
//   bludgeoning, piercing, or slashing damage, as appropriate for the object. …"
// Each is rewritten to an ordinary spell attack of the text's damage (typed by the caster's pick among the physical types each attack),
// repeated from the source card once per round while the spell lasts; movement, changing partners and the multiple attack penalty are notes.
import { htmlToPlainText } from "./description-parser.js";

const PHYSICAL = ["bludgeoning", "piercing", "slashing"];
const BLADE_CAST = /^When you first Cast the Spell, the [a-z]+ automatically flies to the target and Strikes\.$/;
const BLADE_SUSTAIN = /^Each time you Sustain the Spell, the [a-z]+ either Changes Partners or Strikes\.$/;
const BLADE_MAP = /^The [a-z]+'s attacks use and contribute to your multiple attack penalty\.$/;
const BLADE_STRIKE = /^\(attack\) The [a-z]+ attacks its target using your spell attack modifier\. On a hit, the [a-z]+ deals (\d+)d(\d+) damage, of a type determined by the [a-z]+ \(if the [a-z]+ has the versatile trait or can otherwise deal multiple types of damage, you choose each time you attack\)\.$/;
const BLADE_PARTNERS = /^Change the [a-z]+'s target to a different creature within (\d+) feet\. The [a-z]+ flies to its new target\.$/;
const OBJECT_SUSTAIN = /^Once per round, you can Sustain the spell to command the object further, either prompting it to move again or to Strike\.$/;
const OBJECT_ATTACK = /^If prompted to Strike, the object attacks one creature of your choice adjacent to its space\. Make a melee spell attack roll against the creature\. On a success, the creature takes (\d+)d(\d+) damage\. The damage is either bludgeoning, piercing, or slashing damage, as appropriate for the object\.$/;
const OBJECT_NOTES = [/^The object gains a means of locomotion if it does not already have one, such as [a-z ]+, and Strides up to \d+ feet to a space you decide within range\.$/,
    /^If prompted to move, the object Strides up to \d+ feet again to a space within \d+ feet of you\.$/, /^The object doesn't do anything if it doesn't receive further commands from you\.$/,
    /^If you cast [a-z ]+ again, any previously affected object reverts back to normal\.$/, /^You can Dismiss the spell\.$/];

const sentencesOf = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z(])/).filter(Boolean);
const minutes = duration => /^(\d+) minutes?$/.exec(String(duration ?? "").trim())?.[1];

/** {html, formula, dice, die, notes, onCast, attacks, sentences} or null. */
export function extractSustainAttack(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = cut < 0 ? html : html.slice(0, cut), rest = cut < 0 ? "" : html.slice(cut);
    const heightened = rest.match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? [];
    const lasting = Number(minutes(adapted.lifecycle?.duration));
    // (Crystallized Vapors: the emanation is the caster's terrain; the ball of ice its attack.)
    const vapor = lasting ? vaporAttack(adapted, base, heightened, lasting) : undefined;
    if (vapor !== undefined) return vapor;
    if (!lasting || adapted.targeting?.area) return null;
    // (A cantrip heightens from rank 1, whatever rank the item is stored at.)
    const baseRank = adapted.activation?.traits?.includes("cantrip") ? 1 : Number(adapted.rank) || 1;
    // Malicious Shadow: "When you Cast the Spell, and each time you Sustain it, the shadow Strikes the target." / "The shadow's Strikes are melee spell
    // attacks that deal 2d10 damage." / "You choose the type of damage (bludgeoning, piercing, or slashing) when you Cast the Spell." with the multiple
    // attack penalty, what the shadow isn't, and a second paragraph (it vanishes without a shadow; another effect controlling the shadow can be
    // counteracted) — the ordinary spell attack, repeated on each Sustain, of the type picked on the card; the rest notes.
    const shadow = compileShadowStrike(adapted, base, heightened, lasting, baseRank);
    if (shadow !== undefined) return shadow;
    const rope = compileRopeStrike(adapted, base, heightened, lasting, baseRank);
    if (rope !== undefined) return rope;
    const sign = signAttack(adapted, base, heightened, lasting, baseRank);
    if (sign !== undefined) return sign;
    const bulwark = bulwarkAttack(adapted, base, heightened, lasting, baseRank);
    if (bulwark !== undefined) return bulwark;
    // Dancing Blade: a list with Change Partners and Strike.
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(base);
    if (list) {
        const components = adapted.damageComponents ?? [];
        if (adapted.lifecycle?.sustained !== true || components.length !== 1 || components[0].category || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
        const items = Object.fromEntries([...list[1].matchAll(/<li>\s*<strong>\s*([A-Za-z ]+?)\s*<\/strong>([\s\S]*?)<\/li>/gi)].map(match => [match[1], htmlToPlainText(match[2]).replace(/\s+/g, " ").trim()]));
        if (Object.keys(items).sort().join() !== "Change Partners,Strike") return null;
        const lead = sentencesOf(base.slice(0, list.index));
        const cast = lead.findIndex(sentence => BLADE_CAST.test(sentence));
        if (cast < 0 || lead.length !== cast + 4 || !BLADE_SUSTAIN.test(lead[cast + 2]) || !BLADE_MAP.test(lead[cast + 3])) return null;
        if ([...lead.slice(0, cast), lead[cast + 1]].some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence))) return null;
        const strike = BLADE_STRIKE.exec(items.Strike), partners = BLADE_PARTNERS.exec(items["Change Partners"]);
        if (!strike || !partners || `${strike[1]}d${strike[2]}` !== String(components[0].formula).replace(/\s+/g, "")) return null;
        const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d${strike[2]}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
        if (heightened.length && !(step && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${strike[2]}`)) return null;
        return {
            html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${strike[1]}d${strike[2]} untyped damage (double damage on a critical hit).</p>`,
            formula: step ? `(${strike[1]}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${strike[2]}[untyped]` : `${strike[1]}d${strike[2]}[untyped]`,
            dice: `${strike[1]}d${strike[2]}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature",
            notes: [`Each Sustain, the weapon Strikes (attack again from the spell's card) or Changes Partners: ${items["Change Partners"]}`,
                "The weapon's attacks use and add to your multiple attack penalty (apply it yourself).", "The damage type is the weapon's: pick it for each attack (a versatile weapon's too)."],
            sentences: [...lead, items.Strike, items["Change Partners"]]
        };
    }
    // Avenging Wildwood: a conjured creature (a token the module makes) that Strikes when cast and on each Sustain.
    const conjured = conjuredAttack(adapted, base, heightened, lasting, baseRank);
    if (conjured !== undefined) return conjured;
    // Spectral Blade: a thrown blade's ranged spell attack when cast and the first time the caster Sustains each later turn.
    const thrown = spectralAttack(adapted, base, heightened, lasting, baseRank);
    if (thrown !== undefined) return thrown;
    // Spiritual Weapon / Spiritual Armament: a weapon of force or a flung echo of the caster's weapon that attacks when cast and on each Sustain.
    const echo = spiritualAttack(adapted, base, heightened, lasting, baseRank);
    if (echo !== undefined) return echo;
    // Spirit Object: the Strike only when commanded on a Sustain.
    if ((adapted.damageComponents ?? []).length || !/^1 unattended object\b/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const sentences = sentencesOf(base);
    const sustain = sentences.findIndex(sentence => OBJECT_SUSTAIN.test(sentence));
    const attackAt = sentences.findIndex(sentence => /^If prompted to Strike\b/.test(sentence));
    if (sustain < 0 || attackAt < 0) return null;
    const attackText = sentences.slice(attackAt, attackAt + 4).join(" ");
    const attack = OBJECT_ATTACK.exec(attackText);
    if (!attack) return null;
    const others = sentences.filter((sentence, index) => index !== sustain && (index < attackAt || index >= attackAt + 4));
    const narration = others.filter(sentence => !OBJECT_NOTES.some(pattern => pattern.test(sentence)));
    if (narration.length > 1 || narration.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|Strike)\b/i.test(sentence))) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+1\)\s*<\/strong>\s*Increase the maximum Bulk of the target by 1 and the damage by (\d+)d${attack[2]}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0)) return null;
    return {
        html: `<p>Make a melee spell attack roll against the target. On a hit, the target takes ${attack[1]}d${attack[2]} untyped damage (double damage on a critical hit).</p>`,
        formula: step ? `(${attack[1]}+floor((@item.rank - ${baseRank})/1)*${step[1]})d${attack[2]}[untyped]` : `${attack[1]}d${attack[2]}[untyped]`,
        dice: `${attack[1]}d${attack[2]}`, onCast: false, attacks: lasting * 10, target: "1 creature",
        notes: ["The object Strides when cast; each Sustain (once a round) it moves again or Strikes one creature adjacent to it (attack from the spell's card, targeting that creature).",
            "The damage type is the object's: bludgeoning, piercing or slashing (pick it for each attack).", ...others.filter(sentence => OBJECT_NOTES.some(pattern => pattern.test(sentence)))],
        maxBulk: step ? "the target's maximum Bulk rises by 1 a rank" : null,
        sentences: [sentences[sustain], attackText, ...others]
    };
}

// Spiritual Weapon: "When you cast the spell, the weapon appears next to a foe you choose within range and makes a Strike against it." / "Each
// time you Sustain the Spell, you can move the weapon to a new target within range (if needed) and Strike with it." / "The weapon's Strikes are
// melee spell attacks." / "Regardless of its appearance, the weapon deals 2d8 force damage." / "You can deal damage of the type normally dealt
// by the weapon instead of force damage (…)".
const WEAPON_SENTENCES = {
    cast: /^When you cast the spell, the weapon appears next to a foe you choose within range and makes a Strike against it\.$/,
    sustain: /^Each time you Sustain the Spell, you can move the weapon to a new target within range \(if needed\) and Strike with it\.$/,
    map: /^The spiritual weapon uses and contributes to your multiple attack penalty\.$/,
    melee: /^The weapon's Strikes are melee spell attacks\.$/,
    damage: /^Regardless of its appearance, the weapon deals (\d+)d(\d+) ([a-z]+) damage\.$/,
    type: /^You can deal damage of the type normally dealt by the weapon instead of ([a-z]+) damage \(or any of the available damage types for a versatile weapon\)\.$/
};
const WEAPON_NOTES = [/^No other statistics or traits of the weapon apply, and even a ranged weapon attacks adjacent creatures only\.$/,
    /^Despite making a spell attack, the spiritual weapon is a weapon for purposes of triggers, resistances, and so forth\.$/,
    /^The weapon doesn't take up space, grant flanking, or have any other attributes a creature would\.$/,
    /^The weapon can't make any attack other than its Strike, and feats or spells that affect weapons do not apply to it\.$/];
// Spiritual Armament: "Attempt a spell attack roll against the target's AC, dealing 2d8 damage on a hit (or double damage on a critical hit)." /
// "The damage type is the same as the chosen weapon (…)." / "The attack deals spirit damage instead if that would be more detrimental to the
// creature (as determined by the GM)." / … / "Each time you Sustain the spell, you can repeat the attack against any creature within 120 feet."
const ARMAMENT_SENTENCES = {
    attack: /^Attempt a spell attack roll against the target's AC, dealing (\d+)d(\d+) damage on a hit \(or double damage on a critical hit\)\.$/,
    type: /^The damage type is the same as the chosen weapon \(or any of its types for a versatile weapon\)\.$/,
    spirit: /^The attack deals ([a-z]+) damage instead if that would be more detrimental to the creature \(as determined by the GM\)\.$/,
    map: /^This attack uses and contributes to your multiple attack penalty\.$/,
    sustain: /^Each time you Sustain the spell, you can repeat the attack against any creature within (\d+) feet\.$/
};
const ARMAMENT_NOTES = [/^After the attack, the weapon returns to your side\.$/, /^If you sanctify the spell, the attacks are sanctified as well\.$/];

/** Spiritual Weapon / Spiritual Armament as a repeated spell attack, null when the text is one of them but unread, undefined otherwise. */
function spiritualAttack(adapted, base, heightened, lasting, baseRank) {
    const components = adapted.damageComponents ?? [];
    if (adapted.lifecycle?.sustained !== true || components.length !== 1 || components[0].category) return undefined;
    const sentences = sentencesOf(base);
    const find = pattern => sentences.find(sentence => pattern.test(sentence));
    const weapon = WEAPON_SENTENCES.cast.test(sentences.join(" ").match(/When you cast the spell, the weapon appears[^.]*\./)?.[0] ?? "");
    const armament = !weapon && sentences.some(sentence => ARMAMENT_SENTENCES.attack.test(sentence));
    if (!weapon && !armament) return undefined;
    const table = weapon ? WEAPON_SENTENCES : ARMAMENT_SENTENCES, notesFrom = weapon ? WEAPON_NOTES : ARMAMENT_NOTES;
    const claimed = Object.fromEntries(Object.entries(table).map(([key, pattern]) => [key, find(pattern)]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const notes = sentences.filter(sentence => notesFrom.some(pattern => pattern.test(sentence)));
    const narration = sentences.filter(sentence => !Object.values(claimed).includes(sentence) && !notes.includes(sentence));
    if (narration.length > 2 || narration.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|Strike|attack)\b/i.test(sentence))) return null;
    const dice = weapon ? table.damage.exec(claimed.damage) : table.attack.exec(claimed.attack);
    if (`${dice[1]}d${dice[2]}` !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The (?:weapon's )?damage increases by (\d+)d${dice[2]}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${dice[2]}`))) return null;
    const own = weapon ? table.damage.exec(claimed.damage)[3] : table.spirit.exec(claimed.spirit)[1];
    if (weapon && table.type.exec(claimed.type)[1] !== own) return null;
    return {
        html: `<p>Make ${weapon ? "a melee" : "a"} spell attack roll against the target. On a hit, the target takes ${dice[1]}d${dice[2]} untyped damage (double damage on a critical hit).</p>`,
        formula: step ? `(${dice[1]}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${dice[2]}[untyped]` : `${dice[1]}d${dice[2]}[untyped]`,
        dice: `${dice[1]}d${dice[2]}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature",
        types: weapon ? [own, ...PHYSICAL] : [...PHYSICAL, own],
        notes: [weapon ? "Each Sustain, the weapon can move to a new target within range and Strike (attack again from the spell's card)."
                : `Each Sustain, repeat the attack against any creature within ${table.sustain.exec(claimed.sustain)[1]} feet (attack again from the spell's card).`,
            "The attacks use and add to your multiple attack penalty (apply it yourself).",
            weapon ? `The damage is ${own}, or the type the weapon normally deals (pick it for each attack).`
                : `The damage type is the chosen weapon's, or ${own} if the GM judges that more detrimental (pick it for each attack).`, ...notes],
        sentences: [weapon ? claimed.cast : claimed.attack, ...Object.values(claimed).filter(sentence => sentence !== (weapon ? claimed.cast : claimed.attack)), ...notes]
    };
}

// Avenging Wildwood (user decision 2026-10-01: a conjured creature with statistics is a token the module makes): "A Medium tree sprouts in an
// unoccupied square within range, …" / "This animated tree uses your spell attack modifier for its attack rolls and your spell DC for its
// AC." / "Its saving throw modifiers are equal to your spell DC – 10, and it has 20 Hit Points." / "When you Cast the Spell and each time you
// Sustain it, you can have the tree make a branches Strike against a creature within 15 feet of it, dealing 2d8 bludgeoning, piercing, or
// slashing damage." / "You choose the damage type each time." / "Heightened (+2) The animated tree has 10 additional Hit Points, and its
// branches Strike deals 1d8 additional damage."
const CONJURED = {
    sprouts: /^An? (Tiny|Small|Medium|Large) ([a-z]+) sprouts in an unoccupied square within range, [a-z ,']+\.$/,
    stats: /^This animated ([a-z]+) uses your spell attack modifier for its attack rolls and your spell DC for its AC\.$/,
    saves: /^Its saving throw modifiers are equal to your spell DC [–-] 10, and it has (\d+) Hit Points\.$/,
    strike: /^When you Cast the Spell and each time you Sustain it, you can have the ([a-z]+) make an? ([a-z]+) Strike against a creature within (\d+) feet of it, dealing (\d+)d(\d+) bludgeoning, piercing, or slashing damage\.$/,
    type: /^You choose the damage type each time\.$/
};
const CONJURED_NOTES = [/^Other creatures can't occupy its space, but allies can pass through its space\.$/,
    /^If the [a-z]+ is in soil and survives to the end of the spell's duration, it remains as an ordinary, non-magical [a-z]+ and continues to grow and thrive\.$/,
    /^The GM might determine that the [a-z]+ disappears immediately in certain inhospitable situations\.$/];
const SIZES = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg" };

function conjuredAttack(adapted, base, heightened, lasting, baseRank) {
    if (adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return undefined;
    const sentences = sentencesOf(base);
    if (!sentences.some(sentence => CONJURED.stats.test(sentence))) return undefined;
    const claimed = Object.fromEntries(Object.entries(CONJURED).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const notes = sentences.filter(sentence => CONJURED_NOTES.some(pattern => pattern.test(sentence)));
    if (sentences.length !== Object.keys(claimed).length + notes.length) return null;
    const [, size, thing] = CONJURED.sprouts.exec(claimed.sprouts), [, statsThing] = CONJURED.stats.exec(claimed.stats), [, hp] = CONJURED.saves.exec(claimed.saves);
    const [, strikeThing, strikeName, reach, count, faces] = CONJURED.strike.exec(claimed.strike);
    if (statsThing !== thing || strikeThing !== thing) return null;
    // "Heightened (+2) The animated tree has 10 additional Hit Points, and its branches Strike deals 1d8 additional damage."
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The animated ${thing} has (\d+) additional Hit Points, and its ${strikeName} Strike deals (\d+)d${faces} additional damage\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0)) return null;
    return {
        html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${count}d${faces} untyped damage (double damage on a critical hit).</p>`,
        formula: step ? `(${count}+floor((@item.rank - ${baseRank})/${step[1]})*${step[3]})d${faces}[untyped]` : `${count}d${faces}[untyped]`,
        dice: `${count}d${faces}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature", types: [...PHYSICAL],
        conjure: { name: thing, size: SIZES[size], hp: { base: Number(hp), step: step ? Number(step[2]) : 0, interval: step ? Number(step[1]) : 1, baseRank },
            ac: "spell-dc", saves: "spell-dc-minus-10", reach: Number(reach), rangeFeet: Number(/^(\d+) feet$/.exec(String(adapted.targeting?.range ?? ""))?.[1] ?? 0),
            traits: (adapted.activation?.traits ?? []).filter(trait => ["plant", "wood", "fungus", "elemental"].includes(trait)) },
        notes: [`The ${thing} (a token the module made, with its AC, saves and Hit Points) Strikes a creature within ${reach} feet of it when cast and on each Sustain (attack again from the spell's card).`,
            "Pick the damage type (bludgeoning, piercing or slashing) for each attack.", ...notes],
        sentences: [claimed.strike, ...Object.values(claimed).filter(sentence => sentence !== claimed.strike), ...notes]
    };
}

export const PHYSICAL_TYPES = PHYSICAL;

// Spectral Blade: "You throw the blade when you Cast this Spell and the first time you Sustain this spell on subsequent turns, making a ranged
// spell attack against the AC of a creature within 20 feet." / "On a hit, you deal 3d6 spirit damage (or double damage on a critical hit)." /
// "These attacks ignore any circumstance bonuses the target has to AC." with "Heightened (+1) The damage increases by 1d6."
// A ranged spell attack of the text's typed damage, when cast and once per turn on a Sustain while the spell lasts; ignoring circumstance
// bonuses to AC is the GM's note.
const THROWN = {
    throw: /^You throw the [a-z]+ when you Cast this Spell and the first time you Sustain this spell on subsequent turns, making a ranged spell attack against the AC of a creature within (\d+) feet\.$/,
    hit: /^On a hit, you deal (\d+)d(\d+) ([a-z]+) damage \(or double damage on a critical hit\)\.$/
};
const THROWN_NOTES = [/^These attacks ignore any circumstance bonuses the target has to AC\.$/];
function spectralAttack(adapted, base, heightened, lasting, baseRank) {
    const components = adapted.damageComponents ?? [];
    const sentences = sentencesOf(base);
    if (!sentences.some(sentence => THROWN.throw.test(sentence))) return undefined;
    if (components.length !== 1 || components[0].category || String(adapted.targeting?.target ?? "").trim()) return null;
    const claimed = Object.fromEntries(Object.entries(THROWN).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const notes = sentences.filter(sentence => THROWN_NOTES.some(pattern => pattern.test(sentence)));
    const narration = sentences.filter(sentence => !Object.values(claimed).includes(sentence) && !notes.includes(sentence));
    if (narration.length > 1 || narration.some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|Strike|attack)\b/i.test(sentence))) return null;
    const hit = THROWN.hit.exec(claimed.hit);
    if (`${hit[1]}d${hit[2]}` !== String(components[0].formula).replace(/\s+/g, "") || hit[3] !== String(components[0].type).toLowerCase()) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d${hit[2]}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${hit[2]}`))) return null;
    const range = THROWN.throw.exec(claimed.throw)[1];
    return {
        html: `<p>Make a ranged spell attack roll against the target. On a hit, the target takes ${hit[1]}d${hit[2]} ${hit[3]} damage (double damage on a critical hit).</p>`,
        formula: step ? `(${hit[1]}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${hit[2]}[${hit[3]}]` : `${hit[1]}d${hit[2]}[${hit[3]}]`,
        dice: `${hit[1]}d${hit[2]}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature", fixedType: hit[3],
        notes: [`The first time you Sustain the spell each later turn, throw the blade again at a creature within ${range} feet (attack again from the spell's card).`,
            "These attacks ignore the target's circumstance bonuses to AC (such as a raised shield or cover): leave them out of the attack yourself.", "The attacks use and add to your multiple attack penalty (apply it yourself)."],
        sentences: [claimed.throw, claimed.hit, ...notes]
    };
}

// Crystallized Vapors: "You freeze the precipitation around you in icy pellets, creating a @Template[type:emanation|distance:15] of difficult terrain;
// you're immune to this difficult terrain." / "You can launch a ball of ice whenever you Cast this Spell and the first time you Sustain this spell on
// subsequent turns, making a ranged spell attack against the AC of a creature within 30 feet." / "On a hit, you deal 1d12 cold damage and 1d12
// bludgeoning damage (or double damage on a critical hit)." with "Heightened (+3) The damage increases by 1d12 cold and 1d12 bludgeoning." — the
// ordinary ranged spell attack of the item's two entries, when cast and on the first Sustain of each later turn; the emanation a region that moves
// with the caster, difficult terrain for everyone but the caster, for the spell's duration.
const VAPOR = {
    terrain: /^You [a-z ]+ around you in [a-z ]+, creating an? @Template\[(?:type:)?emanation\|distance:(\d+)\] of difficult terrain; you're immune to this difficult terrain\.$/,
    launch: /^You can launch an? [a-z ]+ whenever you Cast this Spell and the first time you Sustain this spell on subsequent turns, making a ranged spell attack against the AC of a creature within (\d+) feet\.$/,
    hit: /^On a hit, you deal (\d+)d(\d+) ([a-z]+) damage and (\d+)d(\d+) ([a-z]+) damage \(or double damage on a critical hit\)\.$/
};
function vaporAttack(adapted, base, heightened, lasting) {
    const sentences = sentencesOf(base);
    if (!sentences.some(sentence => VAPOR.terrain.test(sentence))) return undefined;
    const components = adapted.damageComponents ?? [];
    if (sentences.length !== 3 || !VAPOR.launch.test(sentences[1]) || !VAPOR.hit.test(sentences[2]) || adapted.targeting?.area?.type !== "emanation" || String(adapted.targeting?.target ?? "").trim()) return null;
    const radius = Number(VAPOR.terrain.exec(sentences[0])[1]), range = VAPOR.launch.exec(sentences[1])[1];
    const [, countA, facesA, typeA, countB, facesB, typeB] = VAPOR.hit.exec(sentences[2]);
    const entry = (count, faces, type) => components.find(component => !component.category && String(component.formula).replace(/\s+/g, "") === `${count}d${faces}` && String(component.type).toLowerCase() === type);
    const first = entry(countA, facesA, typeA), second = entry(countB, facesB, typeB);
    if (components.length !== 2 || !first || !second || first === second || Number(adapted.targeting.area.value) !== radius) return null;
    const step = heightened.length === 1 ? /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+d\d+) ([a-z]+) and (\d+d\d+) ([a-z]+)\.\s*<\/p>$/.exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && step[3] === typeA && step[5] === typeB && adapted.heightening.damage?.[first.id] === step[2] && adapted.heightening.damage?.[second.id] === step[4]))) return null;
    return {
        html: `<p>Make a ranged spell attack roll against the target. On a hit, the target takes ${countA}d${facesA} ${typeA} damage and ${countB}d${facesB} ${typeB} damage (double damage on a critical hit).</p>`,
        dice: `${countA}d${facesA}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature", fixedType: typeA, keepArea: false,
        terrainAura: { radius, exemptCaster: true, sourceText: sentences[0] },
        notes: [`The first time you Sustain the spell each later turn, launch another ball at a creature within ${range} feet (attack again from the spell's card).`,
            `The ${radius}-foot emanation around you is difficult terrain for everyone else (a region that moves with you, made with the first attack).`],
        sentences: [sentences[1], sentences[0], sentences[2]]
    };
}

const SHADOW_CAST = /^When you Cast the Spell, and each time you Sustain it, the ([a-z]+) Strikes the target\.$/;
const SHADOW_STRIKE = /^The ([a-z]+)'s Strikes are melee spell attacks that deal (\d+)d(\d+) damage\.$/;
const SHADOW_TYPE = /^You choose the type of damage \(bludgeoning, piercing, or slashing\) when you Cast the Spell\.$/;
const SHADOW_MAP = /^The ([a-z]+) uses and contributes to your multiple attack penalty\.$/;
const SHADOW_NOTHING = [/^The ([a-z]+) doesn't take up space, grant flanking, or have any other attributes a creature would\.$/, /^The ([a-z]+) can't make any attacks other than its Strike\.$/,
    /^The ([a-z]+) moves along with the target, always remaining within reach\.$/];
const SHADOW_VANISHES = /^The ([a-z]+) vanishes if the target ceases to cast a shadow \(usually if it moves into complete darkness or light\)\.$/;
const SHADOW_COUNTERACT = /^If another effect is controlling the target's shadow when you cast [a-z ]+, you can attempt to counteract that effect to temporarily take control of the shadow for [a-z ]+'s duration\.$/;

/** Returns the attack, null (this form, refused), or undefined (not this form). */
function compileShadowStrike(adapted, base, heightened, lasting, baseRank) {
    const sentences = sentencesOf(base);
    const cast = sentences.findIndex(sentence => SHADOW_CAST.test(sentence));
    if (cast < 0) return undefined;
    const components = adapted.damageComponents ?? [];
    if (adapted.lifecycle?.sustained !== true || components.length !== 1 || components[0].category || String(components[0].type).toLowerCase() !== "untyped"
        || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const noun = SHADOW_CAST.exec(sentences[cast])[1];
    let strike = null, typed = false, map = false, vanishes = null, counteract = null;
    for (const [index, sentence] of sentences.entries()) {
        if (index === cast) continue;
        const found = SHADOW_STRIKE.exec(sentence);
        if (found && found[1] === noun && !strike) { strike = found; continue; }
        if (SHADOW_TYPE.test(sentence)) { typed = true; continue; }
        if (SHADOW_MAP.test(sentence)) { map = true; continue; }
        if (SHADOW_NOTHING.some(pattern => pattern.test(sentence))) continue;
        if (SHADOW_VANISHES.test(sentence)) { vanishes = sentence; continue; }
        if (SHADOW_COUNTERACT.test(sentence)) { counteract = sentence; continue; }
        if (index < cast && !/\d|@|\b(?:damage|save|bonus|penalty|condition|Strike)\b/i.test(sentence)) continue;
        return null;
    }
    if (!strike || !typed || !map || `${strike[2]}d${strike[3]}` !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The Strike damage increases by (\d+)d${strike[3]}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length && !(step && adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1]) && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${strike[3]}`)) return null;
    return {
        html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${strike[2]}d${strike[3]} untyped damage (double damage on a critical hit).</p>`,
        formula: step ? `(${strike[2]}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${strike[3]}[untyped]` : `${strike[2]}d${strike[3]}[untyped]`,
        dice: `${strike[2]}d${strike[3]}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature",
        notes: [`Each time you Sustain the spell, the ${noun} Strikes the target again: attack from the spell's card.`, `The ${noun}'s Strikes use and add to your multiple attack penalty (apply it yourself).`,
            "Pick the damage type (bludgeoning, piercing or slashing) when you cast the spell; keep it for every Strike.",
            ...(vanishes ? [`${vanishes} (End the spell in Ongoing spells.)`] : []), ...(counteract ? [`${counteract} (The GM rolls the counteract check.)`] : [])],
        // (The Sustain sentence first: the repeat's source.)
        sentences: [sentences[cast], ...sentences.filter((_, index) => index !== cast)]
    };
}

// Lashing Rope: "When you Cast the Spell and each time you Sustain the Spell, you can make a melee Strike with the rope, which uses and contributes to
// your multiple attack penalty." / "These rope Strikes are melee spell attacks; have the magical, reach, and trip weapon traits; and deal 3d6 slashing
// damage." / the Trip critical failure's own result — the ordinary spell attack of the text's typed damage, repeated on each Sustain (the spell's
// target is the rope; each attack's is the creature); reach, Trip and the critical failure are notes.
const ROPE_STRIKE = /^When you Cast the Spell and each time you Sustain the Spell, you can make a melee Strike with the ([a-z]+), which uses and contributes to your multiple attack penalty\.$/;
const ROPE_TRAITS = /^These ([a-z]+) Strikes are melee spell attacks; have the ([a-z, ]+) weapon traits; and deal (\d+)d(\d+) ([a-z]+) damage\.$/;
const ROPE_TRIP = /^If you critically fail a check to (?:@UUID\[[^\]]+\]\{Trip\}|Trip) using the ([a-z]+), you can't make any more Strikes with it this turn, nor can you use it to make an Attack of Opportunity until the beginning of your next turn\.$/;
const ROPE_REPLACES = /^This replaces the usual results of a critical failure to Trip\.$/;

function compileRopeStrike(adapted, base, heightened, lasting, baseRank) {
    const sentences = sentencesOf(base);
    const at = sentences.findIndex(sentence => ROPE_STRIKE.test(sentence));
    if (at < 0) return undefined;
    const components = adapted.damageComponents ?? [];
    if (adapted.lifecycle?.sustained !== true || components.length !== 1 || components[0].category) return null;
    const noun = ROPE_STRIKE.exec(sentences[at])[1];
    const traits = ROPE_TRAITS.exec(sentences[at + 1] ?? "");
    const trip = ROPE_TRIP.exec(sentences[at + 2] ?? "");
    if (!traits || traits[1] !== noun || !trip || trip[1] !== noun || !ROPE_REPLACES.test(sentences[at + 3] ?? "") || sentences.length !== at + 4
        || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|Strike|attack)\b/i.test(sentence))) return null;
    const [, , weaponTraits, count, die, type] = traits;
    if (`${count}d${die}` !== String(components[0].formula).replace(/\s+/g, "") || type !== String(components[0].type).toLowerCase()) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage from your ${noun} Strikes increases by (\d+)d${die}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${die}`))) return null;
    return {
        html: `<p>Make a melee spell attack roll against the target. On a hit, the target takes ${count}d${die} ${type} damage (double damage on a critical hit).</p>`,
        formula: step ? `(${count}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${die}[${type}]` : `${count}d${die}[${type}]`,
        dice: `${count}d${die}`, onCast: true, attacks: lasting * 10 + 1, target: "1 creature", fixedType: type,
        notes: [`Each time you Sustain the spell, you can Strike with the ${noun} again: attack from the spell's card (target the creature).`,
            `The ${noun}'s Strikes use and add to your multiple attack penalty (apply it yourself), and have the ${weaponTraits} weapon traits (the reach and Trip are the GM's to play).`,
            `${trip[0].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")} This replaces the usual results of a critical failure to Trip.`],
        sentences: [sentences[at], sentences[at + 1], trip[0], sentences[at + 3]]
    };
}

// Sign of Conviction: "As long as you Sustain sign of conviction, you gain a +1 status bonus to AC and saving throws and are Immobilized." / "The DC
// for any effect to force you to move out of your space (such as the Shove action) is equal to your spell DC or the normal DC, whichever is
// higher." / "If you stop being immobilized or are moved out of your space, sign of conviction immediately ends." / "When you Cast the Spell and
// each time you Sustain the Spell, the religious symbol emits a blast of energy at a target within 100 feet." / "Make a spell attack roll that
// deals 2d10 damage on a success (see below for determining damage type) and double damage on a critical success." / "You can Sustain the Spell
// multiple times in the same round to emit an array of blasts." with the deity's damage types (good: fire or spirit; evil: cold or spirit;
// neutral: force) — the ordinary spell attack on the cast and on every Sustain (any number a turn), of the type the caster picks; the caster's
// Effect (made with the first attack) gives the bonus and Immobilized and ends when the caster's token moves; the light, the Shove DC and the
// deity's types are notes.
const SIGN = {
    gain: /^As long as you Sustain [a-z ]+, you gain a \+(\d) (status) bonus to AC and saving throws and are (@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Immobilized\})\.$/,
    shove: /^The DC for any effect to force you to move out of your space \(such as the (?:@UUID\[[^\]]+\]\{Shove\}|Shove) action\) is equal to your spell DC or the normal DC, whichever is higher\.$/,
    ends: /^If you stop being immobilized or are moved out of your space, [a-z ]+ immediately ends\.$/,
    blast: /^When you Cast the Spell and each time you Sustain the Spell, the [a-z ]+ emits a blast of energy at a target within (\d+) feet\.$/,
    attack: /^Make a spell attack roll that deals (\d+)d(\d+) damage on a success \(see below for determining damage type\) and double damage on a critical success\.$/,
    multiple: /^You can Sustain the Spell multiple times in the same round to emit an array of blasts\.$/,
    good: /^If you worship a good deity, the spell gains the good and light traits, deals your choice of either ([a-z]+) or ([a-z]+) damage, and emits bright light in a @Template\[burst\|distance:(\d+)\]\.$/,
    evil: /^If you worship an evil deity, the spell gains the evil and darkness traits, deals your choice of ([a-z]+) or ([a-z]+) damage, and reduces the light level in a @Template\[burst\|distance:(\d+)\] to dim light if it would be brighter\.$/,
    neutral: /^If you worship a neutral deity, the spell gains the ([a-z]+) trait and deals ([a-z]+) damage\.$/
};
function signAttack(adapted, base, heightened, lasting, baseRank) {
    const components = adapted.damageComponents ?? [];
    if (adapted.lifecycle?.sustained !== true || components.length !== 1 || components[0].category || String(adapted.targeting?.target ?? "").trim()) return undefined;
    const sentences = sentencesOf(base);
    if (!sentences.some(sentence => SIGN.gain.test(sentence))) return undefined;
    const claimed = Object.fromEntries(Object.entries(SIGN).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const narration = sentences.filter(sentence => !Object.values(claimed).includes(sentence));
    if (narration.length > 2 || narration.some(sentence => /\d|@|\b(?:saves?|bonus|penalty|conditions?|Strike|attack)\b/i.test(sentence))) return null;
    const [, value, type, , immobilized] = SIGN.gain.exec(claimed.gain), [, count, faces] = SIGN.attack.exec(claimed.attack);
    if (`${count}d${faces}` !== String(components[0].formula).replace(/\s+/g, "")) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d${faces}\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${faces}`))) return null;
    const good = SIGN.good.exec(claimed.good), evil = SIGN.evil.exec(claimed.evil), neutral = SIGN.neutral.exec(claimed.neutral);
    if (neutral[1] !== neutral[2]) return null;
    const types = [...new Set([good[1], good[2], evil[1], evil[2], neutral[2]])];
    return {
        html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${count}d${faces} untyped damage (double damage on a critical hit).</p>`,
        formula: step ? `(${count}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${faces}[untyped]` : `${count}d${faces}[untyped]`,
        dice: `${count}d${faces}`, onCast: true, attacks: lasting * 30 + 1, perTurn: "any", target: "1 creature", types,
        castEffect: { rules: [{ key: "FlatModifier", selector: "ac", type, value: Number(value) }, { key: "FlatModifier", selector: "saving-throw", type, value: Number(value) },
                { key: "GrantItem", uuid: immobilized, inMemoryOnly: true }],
            endsAfterMovement: true, sustained: true, claimText: claimed.gain,
            notes: [unlinkText(claimed.shove), "The spell ends if you stop being immobilized or are moved out of your space (moving your token ends this Effect; then stop attacking from the card).",
                "If you stop Sustaining the spell, delete this Effect."] },
        notes: [`Each Sustain (any number a round), attack a target within ${SIGN.blast.exec(claimed.blast)[1]} feet again from the spell's card.`,
            `The damage type is your deity's: a good deity ${good[1]} or ${good[2]} (and bright light in a ${good[3]}-foot burst), an evil deity ${evil[1]} or ${evil[2]} (and dim light in a ${evil[3]}-foot burst), a neutral deity ${neutral[2]} — pick it for each attack.`],
        sentences: [claimed.blast, ...Object.values(claimed).filter(sentence => sentence !== claimed.blast), ...narration]
    };
}
const unlinkText = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");

// Bonewall Bulwark (a conjured object as a token, user decision 2026-10-01): "The bulwark is 10 feet high, 10 feet long, and 1 foot thick." / "The
// bulwark has an AC of 10 and 30 Hit Points." / "You must create the bulwark in an unbroken open space …" / "It must pass within 5 feet of you." /
// "The bonewall bulwark grants cover from creatures on the opposite side." / "At the beginning of your turn, you may have the limbs attack a single
// creature you're aware of within 5 feet of the wall using your spell attack modifier and dealing 3d10 bludgeoning damage." / "This ignores cover
// and concealment provided by the bonewall bulwark." with "Heightened (+1) The bludgeoning damage increases by 1d10 and the HP of the wall increases
// by 10." — a token of the wall's length (its AC and Hit Points as stated, no saves) within the stated distance; the ordinary spell attack of the
// item's damage at the start of each of the caster's turns against a creature within reach of it; the cover is a note.
const WALL = {
    size: /^The ([a-z]+) is (\d+) feet high, (\d+) feet long, and (\d+) foot thick\.$/,
    stats: /^The ([a-z]+) has an AC of (\d+) and (\d+) Hit Points\.$/,
    space: /^You must create the ([a-z]+) in an unbroken open space so it doesn't pass through any creatures or objects, or the [a-z]+'s dimensions are reduced to fit the smaller space\.$/,
    near: /^It must pass within (\d+) feet of you\.$/,
    cover: /^The [a-z ]+ grants cover from creatures on the opposite side\.$/,
    attack: /^At the beginning of your turn, you may have the ([a-z]+) attack a single creature you're aware of within (\d+) feet of the wall using your spell attack modifier and dealing (\d+)d(\d+) ([a-z]+) damage\.$/,
    ignores: /^This ignores cover and concealment provided by the [a-z ]+\.$/
};
const WALL_SIZES = { 5: "med", 10: "lg", 15: "huge", 20: "grg" };
function bulwarkAttack(adapted, base, heightened, lasting, baseRank) {
    const components = adapted.damageComponents ?? [];
    const sentences = sentencesOf(base);
    if (!sentences.some(sentence => WALL.attack.test(sentence))) return undefined;
    if (adapted.lifecycle?.sustained || components.length !== 1 || components[0].category || String(adapted.targeting?.target ?? "").trim()) return null;
    const claimed = Object.fromEntries(Object.entries(WALL).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    if (Object.values(claimed).some(sentence => !sentence)) return null;
    const narration = sentences.filter(sentence => !Object.values(claimed).includes(sentence));
    if (narration.length > 1 || narration.some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|conditions?|Strike|attack)\b/i.test(sentence))) return null;
    const [, name, , length] = WALL.size.exec(claimed.size), [, statsName, ac, hp] = WALL.stats.exec(claimed.stats), near = WALL.near.exec(claimed.near)[1];
    const [, , reach, count, faces, type] = WALL.attack.exec(claimed.attack);
    if (statsName !== name || !WALL_SIZES[length] || `${count}d${faces}` !== String(components[0].formula).replace(/\s+/g, "") || type !== String(components[0].type).toLowerCase()) return null;
    const step = heightened.length === 1 ? new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The ${type} damage increases by (\d+)d${faces} and the HP of the wall increases by (\d+)\.\s*<\/p>$`).exec(heightened[0].trim()) : null;
    if (heightened.length !== (step ? 1 : 0) || (step && !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === `${step[2]}d${faces}`))) return null;
    return {
        html: `<p>Make a spell attack roll against the target. On a hit, the target takes ${count}d${faces} ${type} damage (double damage on a critical hit).</p>`,
        formula: step ? `(${count}+floor((@item.rank - ${baseRank})/${step[1]})*${step[2]})d${faces}[${type}]` : `${count}d${faces}[${type}]`,
        dice: `${count}d${faces}`, onCast: false, attacks: lasting * 10, trigger: "turn-start", target: "1 creature", fixedType: type,
        conjure: { name, size: WALL_SIZES[length], hp: { base: Number(hp), step: step ? Number(step[3]) : 0, interval: step ? Number(step[1]) : 1, baseRank },
            ac: Number(ac), saves: "none", reach: Number(reach), rangeFeet: Number(near), traits: [] },
        notes: [`The ${name} (a token the module made: AC ${ac}, its Hit Points, no saves) — turn it to lie as the wall should; it must pass within ${near} feet of you and can't pass through creatures or objects.`,
            `At the start of each of your turns, its limbs can attack a creature within ${reach} feet of it (attack from the spell's card, targeting that creature).`,
            `Creatures on the opposite side of the ${name} have cover against those on the other; the limbs' attack ignores the ${name}'s cover and concealment.`],
        sentences: [claimed.attack, ...Object.values(claimed).filter(sentence => sentence !== claimed.attack), ...narration]
    };
}
