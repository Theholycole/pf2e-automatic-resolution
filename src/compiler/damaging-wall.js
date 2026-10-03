// A wall the GM draws whose crossing hurts (Wall of Fire, Wall of Thorns, Wall of Ice; user decision 2026-10-01: what the module can't detect is
// a GM control):
//   Wall of Fire — "Any creature that crosses the wall or is occupying the wall's area at the start of its turn takes 4d6 fire damage." with
//   "Heightened (+1) The fire damage increases by 1d6.";
//   Wall of Thorns — "Everything on each side of the wall has cover from creatures on the opposite side, and the wall's spaces are difficult
//   terrain." / "For every move action a creature uses to enter at least one of the wall's spaces, that creature takes 3d4 piercing damage." with
//   "Heightened (+1) The Hit Points of each section of the wall increase by 5, and the piercing damage increases by 1d4.";
//   Wall of Ice — "A section destroyed by means other than fire leaves behind a chilling mass of ice that is difficult terrain and deals 2d6
//   cold damage to any creature passing through it." with "Heightened (+2) The Hit Points of each section of the wall increase by 10, and the
//   cold damage dealt to creatures crossing a destroyed section increases by 1d6." (the text's interval, not the item's).
//   Burning Trail — "The first time the target Strides during the spell's duration, they leave behind a trail made of magical fire that fills
//   up each space they occupied during that Stride." / "Any creature that enters or starts its turn in the trail's area takes 2d10 fire damage."
//   with "Heightened (+2) The fire damage increases by 1d10." — the trail is placed later: the cast's card has a button for the GM to place it
//   (the region they drew along the Stride) for the rest of the duration.
// The GM draws the wall as a region and selects it. Its damage is the GM's Ongoing control (target the creatures; the module rolls the damage
// at the cast rank and applies it with PF2e's IWR) — per move action for the thorns; a creature in the wall of fire as its turn starts takes it
// automatically. The thorns' spaces are difficult terrain. The shape, sight, cover and the sections' statistics are notes (with the sections' Hit
// Points at the cast rank).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain|cover)\b/i;
const NOTES = [
    /^You create (?:either )?an? \d+-foot-thick wall(?: of [a-z ]+)? in a straight line up to \d+ feet long and \d+ feet high(?: \(the wall doesn't have to be vertical, but it must be anchored on both sides to a solid surface\))?(?:,? or an? \d+-foot-thick, \d+-foot[- ]radius (?:ring|hemisphere)(?: of [a-z]+)?(?: with the same height)?)?\.$/,
    // Wall of Virtue's light (a wall isn't a token: the GM's lighting).
    /^The wall sheds bright light for \d+ feet on each side and dim light for the next \d+ feet\.$/,
    /^The wall stands vertically(?: in either form; if you wish, the wall can be of a shorter length or height)?\.$/,
    /^If you wish, the wall can be of a (?:shorter|smaller) length(?:,)? (?:or )?height(?:, or radius)?\.$/,
    /^You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost\.$/,
    /^Everything on each side of the wall is (?:@UUID\[[^\]]+\]\{Concealed\}|Concealed) from creatures on the opposite side\.$/,
    /^The ice that makes up the wall is opaque\.$/,
    /^Each 10-foot-by-10-foot section of the wall has AC \d+, Hardness \d+, and \d+ Hit Points(?:, and it's immune to [a-z ,]+)?\.$/,
    /^It's immune to critical hits and precision damage\.$/,
    /^A destroyed section can be moved through freely\.$/,
    /^A section also has weakness \d+ to fire; a section of the wall destroyed by fire melts, evaporating into water and steam\.$/
];
const SECTION_HP = /^Each 10-foot-by-10-foot section of the wall has AC \d+, Hardness \d+, and (\d+) Hit Points/;
const CROSS_OR_START = /^Any creature that crosses the wall or is occupying the wall's area at the start of its turn takes (\d+)d(\d+) ([a-z]+) damage(?: and (\d+)d(\d+) ([a-z]+) damage)?\.$/;
// "If the light passes through an area of magical darkness or targets a creature affected by magical darkness, wall of virtue attempts to
// counteract the darkness.": the card's counteract button (the GM names the darkness, its DC and rank).
const DARKNESS_COUNTERACT = /^If the light passes through an area of magical darkness or targets a creature affected by magical darkness, [a-z ]+ attempts to counteract the darkness\.$/;
// "Heightened (+2) The spirit damage increases by 1d8, and the vitality damage increases by 1d8."
const STEP_TWO = /^Heightened \(\+(\d)\) The ([a-z]+) damage increases by (\d+)d(\d+), and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/;
const COVER_TERRAIN = /^Everything on each side of the wall has cover from creatures on the opposite side, and the wall's spaces are difficult terrain\.$/;
const PER_MOVE = /^For every move action a creature uses to enter at least one of the wall's spaces, that creature takes (\d+)d(\d+) ([a-z]+) damage\.$/;
const RUBBLE = /^A section destroyed by means other than fire leaves behind a chilling mass of ice that is difficult terrain and deals (\d+)d(\d+) ([a-z]+) damage to any creature passing through it\.$/;
const STEP_DAMAGE = /^Heightened \(\+(\d)\) The ([a-z]+) damage increases by (\d+)d(\d+)\.$/;
// The trail left by the target's first Stride, its height, its concealment and its damage.
const FIRST_STRIDE = /^The first time the target Strides during the spell's duration, they leave behind a ([a-z]+) made of magical ([a-z]+) that fills up each space they occupied during that Stride\.$/;
const TRAIL_NOTES = [/^This [a-z]+ is \d+ feet high\.$/];
const TRAIL_CONCEALED = /^Creatures on either side of the ([a-z]+) are (?:@UUID\[[^\]]+\]\{Concealed\}|concealed) from creatures on the opposite side\.$/;
const ENTERS_OR_STARTS = /^Any creature that enters or starts its turn in the ([a-z]+)'s area takes (\d+)d(\d+) ([a-z]+) damage\.$/;
const STEP_BOTH = /^Heightened \(\+(\d)\) The Hit Points of each section of the wall increase by (\d+), and the ([a-z]+) damage(?: dealt to creatures crossing a destroyed section)? increases by (\d+)d(\d+)\.$/;

/** Returns {damagingWall, claimed} or null. */
export function compileDamagingWall(adapted) {
    const target = String(adapted.targeting?.target ?? "").trim();
    if ((adapted.defense?.kind ?? "none") !== "none" || adapted.targeting?.area || adapted.lifecycle?.sustained) return null;
    // (A trail left by the target: one creature of the caster's — the target is who leaves it.)
    if (target && !/^(?:your companion or eidolon|1 (?:willing )?creature)$/i.test(target)) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    if (!minutes || ![1, 2].includes(components.length) || components.some(component => component.category)) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let control = null, terrain = false, hp = null, narrated = 0, counteract = null, deferred = null;
    const notes = [];
    for (const sentence of sentences) {
        const cross = !control ? CROSS_OR_START.exec(sentence) : null;
        if (cross) { control = { kind: "wall", trigger: "crossed the wall", turnStart: true, count: Number(cross[1]), faces: Number(cross[2]), type: cross[3], sourceText: sentence,
            ...(cross[4] ? { second: { count: Number(cross[4]), faces: Number(cross[5]), type: cross[6] } } : {}) }; continue; }
        if (!counteract && DARKNESS_COUNTERACT.test(sentence)) { counteract = { target: "magical darkness", text: sentence, result: "is counteracted where the wall's light reaches it" }; continue; }
        const stride = target && !deferred && !control && !notes.length ? FIRST_STRIDE.exec(sentence) : null;
        if (stride) { deferred = { noun: stride[1], sourceText: sentence }; continue; }
        if (deferred && TRAIL_NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        const concealed = deferred ? TRAIL_CONCEALED.exec(sentence) : null;
        if (concealed && concealed[1] === deferred.noun) { notes.push(sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")); continue; }
        const trail = deferred && !control ? ENTERS_OR_STARTS.exec(sentence) : null;
        if (trail && trail[1] === deferred.noun) { control = { kind: "wall", trigger: `entered the ${deferred.noun}`, turnStart: true, count: Number(trail[2]), faces: Number(trail[3]), type: trail[4], sourceText: sentence }; continue; }
        const move = !control ? PER_MOVE.exec(sentence) : null;
        if (move) { control = { kind: "wall", trigger: "used a move action to enter the wall's spaces", perAction: true, count: Number(move[1]), faces: Number(move[2]), type: move[3], sourceText: sentence }; continue; }
        const rubble = !control ? RUBBLE.exec(sentence) : null;
        if (rubble) {
            control = { kind: "wall", trigger: "passed through a destroyed section's ice", count: Number(rubble[1]), faces: Number(rubble[2]), type: rubble[3], sourceText: sentence };
            notes.push("A section destroyed by means other than fire leaves a chilling mass of ice that is difficult terrain: draw it as difficult terrain.");
            continue;
        }
        if (!terrain && COVER_TERRAIN.test(sentence)) { terrain = true; notes.push("Everything on each side of the wall has cover from creatures on the opposite side."); continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) {
            const stats = SECTION_HP.exec(sentence);
            if (stats) hp = Number(stats[1]);
            notes.push(sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1"));
            continue;
        }
        if (!control && !notes.length && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!control || Boolean(target) !== Boolean(deferred)) return null;
    // (The item's damage entries, one per stated type.)
    const stated = [control, ...(control.second ? [control.second] : [])];
    if (stated.length !== components.length || !stated.every(part => components.some(component => String(component.formula).replace(/\s+/g, "") === `${part.count}d${part.faces}`
        && String(component.type).toLowerCase() === part.type))) return null;
    // The Heightened entry: the damage's dice (and the sections' Hit Points), at the text's interval.
    const step = htmlToPlainText(rest[0]).replace(/\s+/g, " ").trim();
    const damageOnly = STEP_DAMAGE.exec(step), both = STEP_BOTH.exec(step), two = STEP_TWO.exec(step);
    if (control.second || two) {
        // Two damage types, each with its own step at the same interval.
        if (!control.second || !two || hp != null) return null;
        const steps = { [two[2]]: { dice: Number(two[3]), faces: Number(two[4]) }, [two[5]]: { dice: Number(two[6]), faces: Number(two[7]) } };
        if (!stated.every(part => steps[part.type]?.faces === part.faces)) return null;
        control.step = { interval: Number(two[1]), dice: steps[control.type].dice };
        control.second.step = { interval: Number(two[1]), dice: steps[control.second.type].dice };
    } else if (damageOnly && damageOnly[2] === control.type && Number(damageOnly[4]) === control.faces && hp == null)
        control.step = { interval: Number(damageOnly[1]), dice: Number(damageOnly[3]) };
    else if (both && both[3] === control.type && Number(both[5]) === control.faces && hp != null)
        Object.assign(control, { step: { interval: Number(both[1]), dice: Number(both[4]) }, sectionHP: { base: hp, add: Number(both[2]), interval: Number(both[1]) } });
    else return null;
    return {
        damagingWall: { durationSeconds: Number(minutes[1]) * 60, terrain, control, notes, baseRank: Number(adapted.rank) || 1, ...(counteract ? { counteract } : {}),
            ...(deferred ? { deferred: { noun: deferred.noun, text: `The first time the target Strides, it leaves the ${deferred.noun}: draw it along the Stride, select it and place it from the cast's card.` } } : {}) },
        claimed: [...sentences, step]
    };
}

/** The damage formula and the sections' Hit Points at a cast rank. */
export function damagingWallAt(data, castRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - data.baseRank) / data.control.step.interval));
    const hp = data.control.sectionHP ? data.control.sectionHP.base + Math.max(0, Math.floor((Number(castRank) - data.baseRank) / data.control.sectionHP.interval)) * data.control.sectionHP.add : null;
    const second = data.control.second;
    // (Two types: one damage roll with both instances, "{1d8[spirit],1d8[vitality]}".)
    if (second) return { formula: `{${data.control.count + steps * data.control.step.dice}d${data.control.faces}[${data.control.type}],${second.count + steps * second.step.dice}d${second.faces}[${second.type}]}`,
        type: null, label: `${data.control.type} and ${second.type}`, sectionHP: hp };
    return { formula: `${data.control.count + steps * data.control.step.dice}d${data.control.faces}`, type: data.control.type, sectionHP: hp };
}
