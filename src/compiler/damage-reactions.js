// Reactions to damage (note-only before): Protector's Sacrifice, Delay Consequence, Interposing Earth.
import { plainText as plain, splitSentences as split } from "./description-parser.js";

const sections = adapted => String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
const NARRATION = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC|Hit Points|terrain|resistances?)\b/i;

// Protector's Sacrifice: "Trigger An ally within 30 feet takes damage." / "Reduce the damage the triggering ally would take by 3. You redirect this
// damage to yourself, but your immunities, weaknesses, resistances and so on do not apply." with "Heightened (+1) The damage you redirect
// increases by 3." — the ally's last damage (PF2e's damageTaken) is reduced by the amount (its Hit Points restored) and the caster loses it
// (no IWR). The other effects of what damaged the ally are notes.
const SACRIFICE_TRIGGER = /^Trigger An ally within (\d+) feet takes damage\.$/;
const REDUCE = /^Reduce the damage the triggering ally would take by (\d+)\.$/;
const REDIRECT = /^You redirect this damage to yourself, but your immunities, weaknesses, resistances and so on do not apply\.$/;
const OTHER_EFFECTS = /^You aren't subject to any conditions or other effects of whatever damaged your ally \([^)]*\)\.$|^Your ally is still subject to those effects even if you redirect all of the triggering damage to yourself\.$/;
export function compileRedirectDamage(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, heightened, ...extra] = sections(adapted);
    const triggered = SACRIFICE_TRIGGER.exec(plain(trigger ?? ""));
    if (!triggered || extra.length) return null;
    const sentences = split(plain(body ?? ""));
    const reduceAt = sentences.findIndex(sentence => REDUCE.test(sentence));
    if (reduceAt < 0 || !REDIRECT.test(sentences[reduceAt + 1] ?? "") || sentences.slice(reduceAt + 2).some(sentence => !OTHER_EFFECTS.test(sentence))
        || sentences.slice(0, reduceAt).some(sentence => NARRATION.test(sentence))) return null;
    const step = heightened ? /^Heightened \(\+(\d+)\) The damage you redirect increases by (\d+)\.$/.exec(plain(heightened)) : null;
    if (heightened && !step) return null;
    return { redirectDamage: { rangeFeet: Number(triggered[1]), amount: Number(REDUCE.exec(sentences[reduceAt])[1]), step: step ? { interval: Number(step[1]), amount: Number(step[2]) } : null, ignoreIWR: true,
        notes: sentences.slice(reduceAt + 2) }, claimed: [plain(trigger), ...sentences, ...(heightened ? [plain(heightened)] : [])] };
}

// Delay Consequence: "Trigger A creature or object within range is hit by an attack." / "Roll damage normally, but do not reduce Hit Points or
// apply any other effects of the attack until the spell's duration has elapsed. When the spell ends, the target is immediately affected by the
// attack, taking damage and being affected by any additional effects. You can Dismiss this spell." — the target's last damage is restored now
// and dealt again when the spell ends (its duration, or Dismiss); the attack's other effects are the GM's then.
const DELAY_TRIGGER = /^Trigger A creature or object within range is hit by an attack\.$/;
const DELAY = /^Roll damage normally, but do not reduce Hit Points or apply any other effects of the attack until the spell's duration has elapsed\.$/;
const DELAY_ENDS = /^When the spell ends, the target is immediately affected by the attack, taking damage and being affected by any additional effects\.$/;
export function compileDelayedDamage(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || !/^1 round$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [trigger, body, ...extra] = sections(adapted);
    if (!DELAY_TRIGGER.test(plain(trigger ?? "")) || extra.length) return null;
    const sentences = split(plain(body ?? ""));
    const at = sentences.findIndex(sentence => DELAY.test(sentence));
    if (at < 0 || sentences.length !== at + 3 || !DELAY_ENDS.test(sentences[at + 1]) || !/^You can Dismiss this spell\.$/.test(sentences[at + 2])
        || sentences.slice(0, at).some(sentence => NARRATION.test(sentence))) return null;
    return { delayedDamage: { endsAt: "caster-turn-start", dismissible: true, notes: ["When the damage is dealt, the attack's other effects apply too (the GM's)."] },
        claimed: [plain(trigger), ...sentences] };
}

// Interposing Earth: "Trigger You are the target of a Strike or would attempt a Reflex save against a damaging area effect." / "… grants you
// standard cover against the triggering effect. If you would be damaged by the triggering effect despite this barrier, the barrier is
// destroyed, and the damage dealt to you is reduced by 2." with "Heightened (4th) The damage reduced increases to 8 …" — an Effect on the caster:
// standard cover (+2 circumstance to AC and Reflex) and resistance to all damage, until the triggering Strike or save and its damage. The
// barrier's statistics and its 3 rounds on the map are notes.
const BARRIER_TRIGGER = /^Trigger You are the target of a Strike or would attempt a Reflex save against a damaging area effect\.$/;
const COVER = /^This barrier appears between you and the source of the triggering effect and grants you standard cover against the triggering effect\.$/;
const REDUCED = /^If you would be damaged by the triggering effect despite this barrier, the barrier is destroyed, and the damage dealt to you is reduced by (\d+)\.$/;
const BARRIER_NOTES = [/^This barrier is 1 inch thick, 5 feet long, 5 feet high, and must be placed on the border between two squares\.$/, /^The barrier remains in place for \d+ rounds \(or until destroyed\)\.$/,
    /^It has AC \d+, \d+ Hardness, and \d+ Hit Points\.$/];
export function compileInterposingCover(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    const [trigger, body, heightened, ...extra] = sections(adapted);
    if (!BARRIER_TRIGGER.test(plain(trigger ?? "")) || extra.length) return null;
    const sentences = split(plain(body ?? ""));
    const coverAt = sentences.findIndex(sentence => COVER.test(sentence));
    const reduced = REDUCED.exec(sentences[coverAt + 1] ?? "");
    if (coverAt < 0 || !reduced) return null;
    const rest = sentences.filter((sentence, index) => index !== coverAt && index !== coverAt + 1);
    const notes = rest.filter(sentence => BARRIER_NOTES.some(pattern => pattern.test(sentence)));
    if (rest.some(sentence => !notes.includes(sentence) && NARRATION.test(sentence))) return null;
    const raised = heightened ? /^Heightened \((\d+)(?:st|nd|rd|th)\) The damage reduced increases to (\d+), the barrier's hardness increases to (\d+), and the barrier's Hit Points increases to (\d+)\.$/.exec(plain(heightened)) : null;
    if (heightened && !raised) return null;
    // (From that rank the barrier's own Hardness and Hit Points are the raised ones: the note says so.)
    return { interposingCover: { cover: { ac: 2, reflex: 2, type: "circumstance" }, reduction: Number(reduced[1]),
        raised: raised ? { rank: Number(raised[1]), reduction: Number(raised[2]), hardness: Number(raised[3]), hp: Number(raised[4]) } : null, notes },
        claimed: [plain(trigger), ...sentences, ...(heightened ? [plain(heightened)] : [])] };
}

/** The amount at a cast rank: the base, plus the step per interval above the base rank. */
export function redirectAt(data, castRank, baseRank = 1) {
    return data.amount + (data.step ? Math.floor(Math.max(0, castRank - baseRank) / data.step.interval) * data.step.amount : 0);
}

// Rebounding Barrier: "Trigger You are hit by a physical Strike." / "You gain resistance 10 against one physical damage type the triggering attack
// deals. Your attacker takes 5 damage of the same type." with "Heightened (+1) The resistance increases by 2. Damage dealt to your attacker increases
// by 1." — the caster picks the type; an Effect with that resistance, removed by the Strike's damage (or at the end of the turn); the attacker (the
// targeted creature) takes the damage of that type now.
const REBOUND_TRIGGER = /^Trigger You are hit by a physical Strike\.$/;
const REBOUND_RESIST = /^You gain resistance (\d+) against one physical damage type the triggering attack deals\.$/;
const REBOUND_DAMAGE = /^Your attacker takes (\d+) damage of the same type\.$/;
const REBOUND_STEP = /^Heightened \(\+(\d+)\) The resistance increases by (\d+)\. Damage dealt to your attacker increases by (\d+)\.$/;
export function compileReboundBarrier(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || (adapted.damageComponents ?? []).length) return null;
    const [trigger, body, heightened, ...extra] = sections(adapted);
    if (!REBOUND_TRIGGER.test(plain(trigger ?? "")) || extra.length) return null;
    const sentences = split(plain(body ?? ""));
    const at = sentences.findIndex(sentence => REBOUND_RESIST.test(sentence));
    // (One opening sentence of narration, which may say "reducing physical damage and rebounding it onto your attacker": no numbers or links.)
    if (at < 0 || at > 1 || !REBOUND_DAMAGE.test(sentences[at + 1] ?? "") || sentences.length !== at + 2 || sentences.slice(0, at).some(sentence => /\d|@|\[\[/.test(sentence))) return null;
    const step = heightened ? REBOUND_STEP.exec(plain(heightened)) : null;
    if (heightened && !step) return null;
    return { reboundBarrier: { resistance: Number(REBOUND_RESIST.exec(sentences[at])[1]), damage: Number(REBOUND_DAMAGE.exec(sentences[at + 1])[1]), types: ["bludgeoning", "piercing", "slashing"],
        step: step ? { interval: Number(step[1]), resistance: Number(step[2]), damage: Number(step[3]) } : null },
        claimed: [plain(trigger), ...sentences, ...(heightened ? [plain(heightened)] : [])] };
}

/** The resistance and the attacker's damage at a cast rank. */
export function reboundAt(data, castRank, baseRank) {
    const steps = data.step ? Math.floor(Math.max(0, Number(castRank) - Number(baseRank)) / data.step.interval) : 0;
    return { resistance: data.resistance + steps * (data.step?.resistance ?? 0), damage: data.damage + steps * (data.step?.damage ?? 0) };
}

// Martyr's Intervention: "Trigger A creature within range would take damage that reduces it to 0 Hit Points" / "Requirements You don't have the wounded
// condition." / "… The target is reduced to 1 Hit Point instead of 0 Hit Points. All remaining damage that was prevented from harming the target creature
// is instead dealt to you. Both you and the target become {Wounded 1}; targets who are already wounded increased their wounded value by 1." — after the
// damage: the target back to 1 Hit Point (out of dying), the caster taking the rest (as dealt), and both wounded one more.
const MARTYR_TRIGGER = /^Trigger A creature within range would take damage that reduces it to 0 Hit Points Requirements You don't have the wounded condition\.?$/;
const ONE_HP = /^The target is reduced to 1 Hit Point instead of 0 Hit Points\.$/;
const REST = /^All remaining damage that was prevented from harming the target creature is instead dealt to you\.$/;
const WOUNDED = /^Both you and the target become (?:@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Wounded 1\}|wounded 1); targets who are already wounded increased their wounded value by 1\.$/;
export function compileMartyrRedirect(adapted) {
    if (adapted.defense?.kind !== "none" || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) || !/^1 living creature$/.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [trigger, body, ...extra] = sections(adapted);
    if (!MARTYR_TRIGGER.test(plain(trigger ?? "")) || extra.length) return null;
    const sentences = split(plain(body ?? ""));
    const at = sentences.findIndex(sentence => ONE_HP.test(sentence));
    // (The narration may say it saves the target's life: no number, link or other rule word.)
    if (at < 0 || sentences.length !== at + 3 || !REST.test(sentences[at + 1]) || !WOUNDED.test(sentences[at + 2])
        || sentences.slice(0, at).some(sentence => NARRATION.test(sentence.replace(/\bto save their life\b/, "")))) return null;
    return { martyrRedirect: { requiresUnwounded: true, wounded: 1, ignoreIWR: true }, claimed: [plain(trigger), ...sentences] };
}
