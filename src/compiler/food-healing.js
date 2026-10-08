// Healing from conjured food: the spell makes food, and the healing happens when a creature eats it.
//   Cornucopia: "A creature who eats the produce with an Interact action regains 1d6+4 HP. The cornucopia, as well as
//   any unconsumed pieces of fruit, wither away at the end of the duration." Heightened (+1): "The cornucopia produces
//   an additional piece of food. A creature can consume any amount of food from the same casting with a single
//   Interact action. Eating six pieces of produce … gives as much nourishment as one square meal …"
//   Nature's Bounty: "A creature can consume the food with an Interact action to regain 3d10+12 Hit Points and be
//   nourished as if it had eaten a meal. If uneaten, the food crumbles to dust after 1 minute."
// Each piece heals the item's healing entry (PF2e's roll at the cast rank). The food lasts the spell's duration, or
// the time the text gives.
import { htmlToPlainText } from "./description-parser.js";
import { WORD_NUMBERS_2_6 as COUNT, DICE_OR_FLAT as DICE, plainSentences as sentencesOf } from "./text-patterns.js";

const FOOD = String.raw`(?:produce|food)`;
const EAT = [
    new RegExp(String.raw`^A creature who eats the ${FOOD} with an Interact action regains ${DICE} (?:HP|Hit Points)()\.$`),
    new RegExp(String.raw`^A creature can consume the ${FOOD} with an Interact action to regain ${DICE} Hit Points( and be nourished as if it had eaten a meal)?\.$`)
];
// The food lasts the spell's duration, or a time of its own.
const WITHERS_WITH_SPELL = /^The [a-z ]+, as well as any unconsumed pieces of [a-z]+, withers? away at the end of the duration\.$/;
const WITHERS_AFTER = /^If uneaten, the (?:food|produce) (?:crumbles to dust|withers away|vanishes) after (\d+) (round|minute|hour)s?\.$/;
// Heightened entries of their own (the healing's own heightening is the item's data).
const MORE_FOOD = /^The [a-z ]+ produces an additional piece of food\.$/;
const ANY_AMOUNT = /^A creature can consume any amount of food from the same casting with a single Interact action\.$/;
const NOURISHMENT = /^Eating (?:\w+) pieces of produce from the [a-z ]+ gives as much nourishment as one square meal for a typical [a-z]+\.$/;
const HEALING_RAISE = /^The Hit Points restored increase by \d+\.$/;
const RULE_WORDS = /\d|\b(?:damage|save|condition|bonus|penalty|immune|Sustain|Dismiss|counteract|can't|must|until|each|whenever|Hit Points|HP|Interact)\b/i;
// PF2e's GM convenience roll for eating everything ("@Damage[…]{Consume all produce}").
const CONVENIENCE = /<p>\s*@Damage\[(?:[^\[\]]|\[[^\]]*\])*\]\{Consume all [a-z ]+\}\s*<\/p>/gi;

const SECONDS = { round: 6, minute: 60, hour: 3600 };

function itemDuration(adapted) {
    const match = /^(\d+) (round|minute|hour)s?$/.exec(String(adapted.duration?.value ?? adapted.lifecycle?.duration ?? "").trim().toLowerCase());
    return match ? { value: Number(match[1]), unit: match[2] } : null;
}

// A well creatures tap for healing (Healing Well): "At any time during the duration, if you or an ally are adjacent to the well, that character
// can Interact to tap into the well's power, recovering 4d8 Hit Points." / "When the well has been tapped five times, the spell ends." — the
// food route's card with five taps (each the item's healing at the cast rank); the placement and the rest are notes.
const TAP = /^At any time during the duration, if you or an ally are adjacent to the ([a-z]+), that character can Interact to tap into the \1's power, recovering (\d+d\d+) Hit Points\.$/;
const TAPS = /^When the ([a-z]+) has been tapped (two|three|four|five|six|\d+) times, the spell ends\.$/;
const WELL_NOTES = [
    /^The [a-z]+ appears as a disc of shimmering light on the ground in a square within range\.$/,
    /^The [a-z]+ is made of insubstantial energy, allowing creatures to move through it and even end their turn in its space\.$/,
    /^If you use an ability that increases the amount of healing this spell grants, that increase applies only to the first time someone taps into the [a-z]+\.$/
];
function compileWell(adapted, components, base, heightened) {
    let tap = null, taps = null;
    const notes = [], narration = [];
    for (const sentence of base) {
        const found = !tap ? TAP.exec(sentence) : null;
        if (found) { tap = found; continue; }
        const limit = tap && !taps ? TAPS.exec(sentence) : null;
        if (limit && limit[1] === tap[1]) { taps = COUNT[limit[2]] ?? Number(limit[2]); continue; }
        if (WELL_NOTES.some(pattern => pattern.test(sentence))) { notes.push({ kind: "well", text: sentence }); continue; }
        if (!tap && !narration.length && !RULE_WORDS.test(sentence)) { narration.push(sentence); continue; }
        return null;
    }
    if (!tap || !taps || String(components[0].formula).replace(/\s+/g, "") !== tap[2]) return null;
    const expires = itemDuration(adapted);
    if (!expires) return null;
    // ("Heightened (+1) The healing increases by 3.": the item's own heightening.)
    for (const [, , body] of heightened.matchAll(/<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>([\s\S]*?)(?=<strong>\s*Heightened\b|$)/gi))
        for (const sentence of sentencesOf(body)) if (!(/^The healing increases by \d+\.$/.test(sentence) && adapted.heightening?.damage)) return null;
    return {
        healing: { formula: components[0].formula, damageType: String(components[0].type ?? "untyped").toLowerCase(), recipient: "consumer",
            food: { pieces: { base: taps, perRank: 0, interval: 1 }, anyAmount: false, expires, verb: "tap", noun: tap[1], notes } },
        evidence: { narration: narration[0] ?? null, lasts: "spell-duration", tap: tap[0] }
    };
}

// A pool creatures soak in for the hour (Soothing Spring): "Any creature that spends the full hour soaking in the hot spring or basking in the mud from the
// bottom of the pit regains 10d8 Hit Points and feels refreshed, losing the Fatigued condition." with the usual-fatigue note and the pool's size and
// capacity ("It can contain 16 Medium or smaller creatures at a time. A Large creature counts as four Medium creatures, …") — the food route's card,
// one soak for each place in the pool (the item's healing at the cast rank, then Fatigued removed); the pool's size and structure are notes.
const SOAK = /^Any creature that spends the full hour soaking in the [a-z ]+ or basking in the mud from the bottom of the pit regains (\d+d\d+) Hit Points and feels refreshed, losing the (?:@UUID\[[^\]]+\]\{Fatigued\}|Fatigued) condition\.$/;
const SPRING_NOTES = [
    /^As normal for effects that remove fatigue, this doesn't remove any underlying source of fatigue, such as lack of sleep, causing the condition to return if the underlying source isn't addressed\.$/,
    /^The pool is \d+ feet on each side, and it's \d+ feet deep\.$/,
    /^A Large creature counts as four Medium creatures, but a Huge creature fills the entire pool\.$/,
    /^This pool has the structure trait and the same restrictions as magic items that create structures\.$/
];
const CAPACITY = /^It can contain (\d+) Medium or smaller creatures at a time\.$/;
function compileSpring(adapted, components, base, heightened) {
    let soak = null, capacity = null;
    const notes = [], narration = [];
    for (const sentence of base) {
        const found = !soak ? SOAK.exec(sentence) : null;
        if (found) { soak = found; continue; }
        const room = !capacity ? CAPACITY.exec(sentence) : null;
        if (room) { capacity = Number(room[1]); notes.push({ kind: "spring", text: sentence }); continue; }
        if (SPRING_NOTES.some(pattern => pattern.test(sentence))) { notes.push({ kind: "spring", text: sentence }); continue; }
        if (!soak && narration.length < 3 && !RULE_WORDS.test(sentence)) { narration.push(sentence); continue; }
        return null;
    }
    if (!soak || !capacity || String(components[0].formula).replace(/\s+/g, "") !== soak[1]) return null;
    const expires = itemDuration(adapted);
    if (!expires) return null;
    for (const [, , body] of heightened.matchAll(/<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>([\s\S]*?)(?=<strong>\s*Heightened\b|$)/gi))
        for (const sentence of sentencesOf(body)) if (!(/^The healing increases by \d+d\d+\.$/.test(sentence) && adapted.heightening?.damage)) return null;
    return {
        healing: { formula: components[0].formula, damageType: String(components[0].type ?? "untyped").toLowerCase(), recipient: "consumer",
            food: { pieces: { base: capacity, perRank: 0, interval: 1 }, anyAmount: false, expires, verb: "soak", noun: "pool", removes: ["fatigued"], notes } },
        evidence: { narration: narration[0] ?? null, lasts: "spell-duration", soak: soak[0] }
    };
}

// A beacon on the caster whose healing weakens with each use (Vital Beacon): "Once per round, either you or an ally can use an Interact action to
// supplicate and lay hands upon you to regain Hit Points." / "It restores @Damage[(@item.rank)d10[healing,vitality]] Hit Points to the first
// creature, …d8… to the second, …d6… to the third, and …d4… to the fourth, after which the spell ends." — the food card with four taps, each
// its own formula at the cast rank (the dice count is the rank: "Heightened (+1) … one additional die …").
const BEACON = /^It restores @Damage\[\(@item\.rank\)d(\d+)\[healing,vitality\]\|shortLabel\] Hit Points to the first creature, @Damage\[\(@item\.rank\)d(\d+)\[healing,vitality\]\|shortLabel\] Hit Points to the second, @Damage\[\(@item\.rank\)d(\d+)\[healing,vitality\]\|shortLabel\] Hit Points to the third, and @Damage\[\(@item\.rank\)d(\d+)\[healing,vitality\]\|shortLabel\] Hit Points to the fourth, after which the spell ends\.$/;
const BEACON_NOTES = [
    /^Once per round, either you or an ally can use an Interact action to supplicate and lay hands upon you to regain Hit Points\.$/,
    /^Each time the beacon heals someone, it decreases in strength\.$/,
    /^You can have only one [a-z ]+ active at a time\.$/
];
const BEACON_STEP = /^The beacon restores one additional die of Hit Points each time it heals, using the same die size as the others for that step\.$/;
function compileBeacon(adapted) {
    if ((adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const body = (cut >= 0 ? html.slice(0, cut) : html).replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "");
    const sentences = sentencesOf(body.replace(/@Damage\[/g, "@@D[")).map(sentence => sentence.replace(/@@D\[/g, "@Damage["));
    let sequence = null;
    const notes = [], narration = [];
    for (const sentence of sentences) {
        const steps = !sequence ? BEACON.exec(sentence) : null;
        if (steps) { sequence = steps.slice(1, 5).map(faces => `(@item.rank)d${faces}[healing,vitality]`); continue; }
        if (BEACON_NOTES.some(pattern => pattern.test(sentence))) { notes.push({ kind: "beacon", text: sentence }); continue; }
        if (!notes.length && !sequence && !narration.length && !/\d|@/.test(sentence)) { narration.push(sentence); continue; }
        return null;
    }
    if (!sequence || notes.length !== 3) return null;
    const heightened = cut >= 0 ? sentencesOf(html.slice(cut).replace(/<strong>\s*Heightened \(\+1\)\s*<\/strong>/i, "")) : [];
    if (heightened.length > 1 || (heightened.length && !BEACON_STEP.test(heightened[0]))) return null;
    // ("until your next daily preparations": a day.)
    if (!/^until your next daily preparations$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    return {
        healing: { formula: sequence[0], damageType: "vitality", recipient: "consumer",
            food: { pieces: { base: 4, perRank: 0, interval: 1 }, anyAmount: false, expires: { value: 24, unit: "hour" }, verb: "tap", noun: "beacon", sequence, notes } },
        evidence: { narration: narration[0] ?? null, lasts: "daily-preparations", beacon: true }
    };
}

export function compileFoodHealing(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    if (BEACON_NOTES[0].test(htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).find(sentence => /^Once per round/.test(sentence)) ?? "")) return compileBeacon(adapted);
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || JSON.stringify(components[0].kinds) !== JSON.stringify(["healing"])) return null;
    const html = String(adapted.descriptionHTML ?? "").replace(CONVENIENCE, "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = sentencesOf(cut >= 0 ? html.slice(0, cut) : html);
    const heightened = cut >= 0 ? html.slice(cut) : "";
    if (base.some(sentence => TAP.test(sentence))) return compileWell(adapted, components, base, heightened);
    if (base.some(sentence => SOAK.test(sentence))) return compileSpring(adapted, components, base, heightened);
    let healed = null, nourished = false, lasts = null;
    const narration = [];
    for (const sentence of base) {
        const eat = !healed && EAT.map(pattern => pattern.exec(sentence)).find(Boolean);
        if (eat) { healed = eat[1]; nourished = Boolean(eat[2]); continue; }
        if (WITHERS_WITH_SPELL.test(sentence) && healed) { lasts = "spell"; continue; }
        const after = WITHERS_AFTER.exec(sentence);
        if (after && healed) { lasts = { value: Number(after[1]), unit: after[2] }; continue; }
        // One narration sentence before the food is eaten (it conjures the food); nothing else.
        if (!healed && !narration.length && !RULE_WORDS.test(sentence)) { narration.push(sentence); continue; }
        return null;
    }
    if (!healed || !lasts || !narration.length) return null;
    if (String(components[0].formula).replace(/\s+/g, "") !== healed) return null;
    const expires = lasts === "spell" ? itemDuration(adapted) : lasts;
    if (!expires) return null;
    // Heightened entries: one per paragraph, each a sentence set this reads (or the item's own healing increase).
    let perRank = 0, anyAmount = false, interval = null;
    const notes = nourished ? [{ kind: "nourishment", text: "The creature is nourished as if it had eaten a meal." }] : [];
    for (const [, step, body] of heightened.matchAll(/<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>([\s\S]*?)(?=<strong>\s*Heightened\b|$)/gi)) {
        for (const sentence of sentencesOf(body)) {
            if (MORE_FOOD.test(sentence)) { perRank = 1; interval = Number(step); continue; }
            if (ANY_AMOUNT.test(sentence) && perRank) { anyAmount = true; continue; }
            if (NOURISHMENT.test(sentence) && perRank) { notes.push({ kind: "nourishment", text: sentence }); continue; }
            if (HEALING_RAISE.test(sentence) && adapted.heightening?.damage) continue;
            return null;
        }
    }
    if (heightened && !/<strong>\s*Heightened \(\+\d+\)/i.test(heightened)) return null;
    return {
        healing: {
            formula: components[0].formula, damageType: String(components[0].type ?? "untyped").toLowerCase(),
            recipient: "consumer",
            food: { pieces: { base: 1, perRank, interval: interval ?? 1 }, anyAmount, expires, ...(notes.length ? { notes } : {}) }
        },
        evidence: { narration: narration[0], lasts: lasts === "spell" ? "spell-duration" : "text", convenienceRolls: (String(adapted.descriptionHTML ?? "").match(CONVENIENCE) ?? []).length }
    };
}

/** Pieces of food a cast makes at `castRank` (the spell's own rank is `baseRank`). */
export function foodPieces(food, castRank, baseRank) {
    const steps = Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / (food.pieces.interval || 1)));
    return food.pieces.base + food.pieces.perRank * steps;
}

/** Seconds of world time the food lasts. */
export function foodSeconds(food) {
    return food.expires.value * SECONDS[food.expires.unit];
}
