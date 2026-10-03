// Retaliation (thorns): a spell on the caster that damages creatures who hit or grab it, with no save:
//   Nettleskin: "Adjacent creatures that hit you with a melee or unarmed attack take 1d4 piercing damage as the nettles jab them and
//   break off. Each time a creature takes damage in this way, nettleskin's duration decreases by 1 round."
//   Armor of Thorn and Claw: "Whenever a creature touches you or hits you with a melee unarmed attack, it takes 1 piercing damage.
//   Additionally, if you become Grabbed, Restrained, or otherwise held Immobilized in a creature's grasp, …, the creature takes
//   @Damage[(ceil(@item.rank / 2))d4[persistent,bleed]] damage."
//   Vibrant Thorns: "Adjacent creatures that hit you … take @Damage[(@item.rank)[piercing]] damage each time they do. Anytime you cast a
//   vitality spell, the thorns' damage increases to @Damage[(@item.rank)d6[piercing]] until the start of your next turn."
// Casting sets a marker on the caster, tracked in Ongoing spells; each trigger is a control that deals its damage to the targeted
// creature. The GM judges when a creature sets it off.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { proveEffectNote } from "./effect-note-proof.js";

const DICE = String.raw`(\d+d\d+|\d+)`;
const HIT_TRIGGERS = [
    { pattern: new RegExp(String.raw`^Adjacent creatures that hit you with a melee or unarmed attack take ${DICE} ([a-z]+) damage(?: as [a-z ,']+)?\.$`), trigger: "An adjacent creature hits you with a melee or unarmed attack." },
    { pattern: new RegExp(String.raw`^Whenever a creature touches you or hits you with a melee unarmed attack, it takes ${DICE} ([a-z]+) damage\.$`), trigger: "A creature touches you or hits you with a melee unarmed attack." },
    // Warning Stripes: "Any creature that touches you or hits you with an unarmed melee attack takes 2d8 poison damage."
    { pattern: new RegExp(String.raw`^Any creature that touches you or hits you with an unarmed melee attack takes ${DICE} ([a-z]+) damage\.$`), trigger: "A creature touches the bearer or hits it with an unarmed melee attack." }
];
// "If you have an animal companion, you can cast this spell on them instead, with a range of 30 feet.": the marker goes on the targeted
// companion instead (the caster confirms it's their animal companion).
const COMPANION = /^If you have an animal companion, you can cast this spell on them instead, with a range of (\d+) feet\.$/;
const HIT_TEXT_FORMULA = /^Adjacent creatures that hit you with a melee attack, as well as creatures that hit you with unarmed attacks, take @Damage\[(\(@item\.(?:rank|level)\))\[([a-z]+)\]\] damage each time they do\.$/;
const AFTER_VITALITY = /^Anytime you cast a vitality spell, the thorns' damage increases to @Damage\[(\(@item\.(?:rank|level)\)d\d+)\[([a-z]+)\]\] until the start of your next turn\.$/;
const HELD = /^Additionally, if you become Grabbed, Restrained, or otherwise held Immobilized in a creature's grasp, such as by being engulfed or swallowed, the creature takes @Damage\[(\([^\[\]]+\)d\d+)\[persistent,([a-z]+)\]\] damage\.$/;
// "Each time a creature within the emanation takes fire damage, it catches on fire, taking @Damage[(…)d4[persistent,fire]] damage."
const AURA_CATCHES = /^Each time a creature within the emanation takes ([a-z]+) damage, it catches on fire, taking @Damage\[(\([^\[\]]+\)d\d+)\[persistent,([a-z]+)\]\] damage\.$/;
const SHORTEN = /^Each time a creature takes damage in this way, [a-z' ]+ duration decreases by 1 round\.$/i;
const NARRATION_WORDS = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|can't|must|each|whenever|until|attack)\b/i;

const readsRank = formula => [...String(formula).matchAll(/@([a-z0-9_.]+)/gi)].every(match => ["item.rank", "item.level"].includes(match[1].toLowerCase()));

/**
 * Returns {retaliation} or null. An emanation around the caster may carry one linked PF2e Effect that is only an Aura (its radius):
 * that Effect is the marker.
 */
export function compileRetaliation(adapted, nativeSpellEffects = null) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack")) return null;
    const consecrated = compileConsecratedBody(adapted, nativeSpellEffects);
    if (consecrated !== undefined) return consecrated;
    const proven = compileProvenMarker(adapted, nativeSpellEffects);
    if (proven !== undefined) return proven;
    const guarded = compileGuardedAlly(adapted, nativeSpellEffects);
    if (guarded !== undefined) return guarded;
    const shields = compileAuraShields(adapted, nativeSpellEffects);
    if (shields !== undefined) return shields;
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    const auraEffect = linked.length === 1 && linked[0].resolutionStatus === "resolved"
        && (linked[0].document?.mechanics?.rules ?? []).length === 1 && linked[0].document.mechanics.rules[0].key === "Aura" ? linked[0] : null;
    if (adapted.targeting?.area && !(adapted.targeting.area.type === "emanation" && auraEffect)) return null;
    if ((nativeSpellEffects?.references ?? []).length && !auraEffect) return null;
    if (!["", "self"].includes(String(adapted.targeting?.target ?? "").trim().toLowerCase())) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!duration || adapted.lifecycle?.sustained) return null;
    const durationSeconds = Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6);
    const components = adapted.damageComponents ?? [];
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
        .split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const triggers = [];
    let shorten = false, narrated = 0, companion = null;
    for (const sentence of sentences) {
        const hit = HIT_TRIGGERS.map(entry => ({ entry, match: entry.pattern.exec(sentence) })).find(found => found.match);
        if (hit) {
            // The item's damage entry, as PF2e heightens it.
            const component = components.length === 1 && !components[0].category ? components[0] : null;
            if (!component || String(component.formula).replace(/\s+/g, "") !== hit.match[1] || String(component.type).toLowerCase() !== hit.match[2]) return null;
            triggers.push({ trigger: hit.entry.trigger, damage: { componentId: component.id, formula: hit.match[1], type: hit.match[2] }, sourceText: sentence });
            continue;
        }
        let match;
        if ((match = HIT_TEXT_FORMULA.exec(sentence)) && !components.length && readsRank(match[1])) {
            triggers.push({ trigger: "An adjacent creature hits you with a melee attack, or any creature hits you with an unarmed attack.", damage: { formula: match[1], type: match[2] }, sourceText: sentence });
            continue;
        }
        if ((match = AFTER_VITALITY.exec(sentence)) && triggers.length && readsRank(match[1])) {
            triggers.push({ trigger: "As above, after you cast a vitality spell (until the start of your next turn).", damage: { formula: match[1], type: match[2] }, sourceText: sentence });
            continue;
        }
        if ((match = AURA_CATCHES.exec(sentence)) && auraEffect && readsRank(match[2])) {
            triggers.push({ trigger: `A creature within the emanation takes ${match[1]} damage.`, damage: { formula: match[2], type: match[3], persistent: true }, sourceText: sentence });
            continue;
        }
        if ((match = HELD.exec(sentence)) && triggers.length && readsRank(match[1])) {
            triggers.push({ trigger: "You become Grabbed, Restrained or otherwise held Immobilized in a creature's grasp (engulfed, swallowed …).", damage: { formula: match[1], type: match[2], persistent: true }, sourceText: sentence });
            continue;
        }
        if (SHORTEN.test(sentence) && triggers.length) { shorten = true; continue; }
        const pet = triggers.length && !companion ? COMPANION.exec(sentence) : null;
        if (pet) { companion = { range: Number(pet[1]), sourceText: sentence }; continue; }
        // "…; they pass through and don't damage any clothing or armor you wear.": what the thorns don't do.
        if (!triggers.length && narrated < 2 && !NARRATION_WORDS.test(sentence.replace(/\bdon't damage any clothing or armor you wear\b/, ""))) { narrated++; continue; }
        return null;
    }
    if (!triggers.length) return null;
    return { retaliation: { triggers, durationSeconds, shortenPerHit: shorten, sourceText: triggers.map(trigger => trigger.sourceText).join(" "),
        ...(companion && !auraEffect ? { companion } : {}),
        ...(auraEffect ? { effect: { uuid: auraEffect.uuid, label: auraEffect.label } } : {}) } };
}

// An ally guarded against one enemy (Defended by Spirits): "Each time the enemy attacks and damages the ally, the enemy takes 1d6
// spirit damage." with the Target "1 ally and 1 enemy". The marker goes on the ally; the retaliation always hits the named enemy.
// "The enemy is aware of these spirits and has a general sense that attacking the ally will draw the spirits' ire." is narration.
const GUARD = new RegExp(String.raw`^Each time the enemy attacks and damages the ally, the enemy takes ${DICE} ([a-z]+) damage\.$`);
const GUARD_AWARE = /^The enemy is aware of these [a-z]+ and has a general sense that attacking the ally will draw the [a-z']+ ire\.$/;

/** Returns {retaliation} for a guarded ally, null when the Target names one but the rest isn't read, and undefined otherwise. */
function compileGuardedAlly(adapted, nativeSpellEffects) {
    if (!/^(?:1|one) ally and (?:1|one) enemy$/i.test(String(adapted.targeting?.target ?? "").trim())) return undefined;
    if (adapted.targeting?.area || [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? []), ...(nativeSpellEffects?.references ?? [])].length) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const component = components.length === 1 && !components[0].category ? components[0] : null;
    if (!duration || !component) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let trigger = null, narrated = 0;
    for (const sentence of sentences) {
        const hit = GUARD.exec(sentence);
        if (hit && !trigger) {
            if (String(component.formula).replace(/\s+/g, "") !== hit[1] || String(component.type).toLowerCase() !== hit[2]) return null;
            trigger = { trigger: "The enemy attacks and damages the ally.", damage: { componentId: component.id, formula: hit[1], type: hit[2] }, fixedTarget: "enemy", sourceText: sentence };
            continue;
        }
        if (GUARD_AWARE.test(sentence) && trigger) continue;
        if (!trigger && narrated < 1 && !NARRATION_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!trigger) return null;
    return { retaliation: { triggers: [trigger], durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6),
        shortenPerHit: false, sustained: adapted.lifecycle?.sustained === true, guard: { ally: 1, enemy: 1 }, sourceText: sentences.filter(sentence => sentence === trigger.sourceText || GUARD_AWARE.test(sentence)).join(" ") } };
}

// Allies shielded in the caster's champion aura (Shields of the Spirit): PF2e's Effect on the caster raises its shield (a granted
// Raise a Shield Effect) and, through its Aura, gives allies in the champion's aura the AC bonus. "… each time an enemy makes an
// attack against the ally, the enemy takes 1d4 spirit damage (even if it misses)." is the Retaliate control.
const AURA_SHIELDS = new RegExp(String.raw`^While one of your allies is in your champion's aura, the shields grant them a \+(\d) status bonus to AC, and each time an enemy makes an attack against the ally, the enemy takes ${DICE} ([a-z]+) damage \(even if it misses\)\.$`);
const AURA_SHIELDS_RULES = [
    /^You Raise your Shield, causing [a-z ]+ to float within your champion's aura\.$/,
    /^The shields last until the start of your next turn or until you're no longer raising your shield, whichever comes first\.$/,
    /^The benefit applies only while an ally is in your aura, ending for any ally that leaves and applying to any that enters later\.$/,
    /^As normal, you don't count as your own ally and therefore don't get the benefits of the [a-z ]+ yourself\.$/
];
const RAISE_A_SHIELD = "Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr";

/** Returns {retaliation} for champion-aura shields, null when the text is that form but isn't proved, and undefined otherwise. */
function compileAuraShields(adapted, nativeSpellEffects) {
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    if (!/\bchampion's aura\b/.test(text) || !/\beach time an enemy makes an attack against the ally\b/.test(text)) return undefined;
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    const effect = linked.length === 1 && linked[0].resolutionStatus === "resolved" ? linked[0] : null;
    const rules = effect?.document?.mechanics?.rules ?? [];
    const duration = effect?.document?.mechanics?.duration ?? {};
    const components = adapted.damageComponents ?? [];
    const component = components.length === 1 && !components[0].category ? components[0] : null;
    if (!effect || !component || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const requirements = String(adapted.activation?.requirements ?? "").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean)
        .filter(sentence => !(requirements && sentence === `Requirements ${requirements}`) && sentence !== effect.label && !/^Spell Effect: /.test(sentence));
    let shields = null;
    for (const sentence of sentences) {
        const match = AURA_SHIELDS.exec(sentence);
        if (match && !shields) { shields = { bonus: Number(match[1]), formula: match[2], type: match[3], sourceText: sentence }; continue; }
        if (AURA_SHIELDS_RULES.some(pattern => pattern.test(sentence))) continue;
        return null;
    }
    if (!shields || String(component.formula).replace(/\s+/g, "") !== shields.formula || String(component.type).toLowerCase() !== shields.type) return null;
    // The Effect: an Aura giving allies (not the caster) an Effect, the ally's AC bonus, and the granted Raise a Shield; 1 round to the
    // start of the caster's turn.
    const aura = rules.find(rule => rule.key === "Aura" && (rule.effects ?? []).length === 1 && rule.effects[0].affects === "allies" && rule.effects[0].includesSelf === false);
    const ac = rules.find(rule => rule.key === "FlatModifier" && rule.selector === "ac" && rule.type === "status" && Number(rule.value) === shields.bonus);
    const raise = rules.find(rule => rule.key === "GrantItem" && rule.uuid === RAISE_A_SHIELD);
    if (!aura || !ac || !raise || rules.length !== 3 || duration.value !== 1 || duration.unit !== "rounds" || duration.expiry !== "turn-start") return null;
    return { retaliation: { triggers: [{ trigger: "An enemy makes an attack against an ally in your champion's aura (even if it misses).", damage: { componentId: component.id, formula: shields.formula, type: shields.type }, sourceText: shields.sourceText }],
        durationSeconds: 6, shortenPerHit: false, sourceText: shields.sourceText, effect: { uuid: effect.uuid, label: effect.label } } };
}

/** "1d4" heightened by "+1d4" per step, or "1" by "+2": the formula at the cast rank. */
export function heightenedComponentFormula(base, add, steps) {
    if (!add || steps <= 0) return String(base);
    const dice = /^(\d+)d(\d+)$/, a = dice.exec(base), b = dice.exec(add);
    if (a && b && a[2] === b[2]) return `${Number(a[1]) + Number(b[1]) * steps}d${a[2]}`;
    if (/^\d+$/.test(base) && /^\d+$/.test(add)) return String(Number(base) + Number(add) * steps);
    return `${base}+${Array.from({ length: steps }, () => add).join("+")}`;
}

// Healing at the end of each of the targets' own turns: Fated Healing — "The targets regain 1d4 Hit Points at the end of each of
// their own turns while the spell is in effect. If a target uses a hostile action against the other target, the spell ends for the
// target that used the hostile action." Each target gets its own ongoing record (the GM ends one when it turns hostile).
const TURN_HEAL = /^The targets? regains? (\d+d\d+|\d+) Hit Points at the end of each of (?:their|its) own turns while the spell is in effect\.$/;
const ENDS_FOR_HOSTILE = /^If a target uses a hostile action against the other target, the spell ends for the target that used the hostile action\.$/;

/** Returns {turnHealing} or null. */
export function compileTurnHealing(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.activation?.traits?.includes("attack") || adapted.targeting?.area) return null;
    const count = /^(?:(1|one)|(2|two)) creatures?(?: who are hostile toward each other)?$/i.exec(String(adapted.targeting?.target ?? "").trim());
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    if (!count || !duration || adapted.lifecycle?.sustained || components.length !== 1 || !components[0].kinds?.includes("healing")) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let heal = null, endsForHostile = null, narrated = 0;
    for (const sentence of sentences) {
        const match = TURN_HEAL.exec(sentence);
        if (match && !heal) { if (match[1] !== String(components[0].formula).replace(/\s+/g, "")) return null; heal = sentence; continue; }
        if (ENDS_FOR_HOSTILE.test(sentence) && heal) { endsForHostile = sentence; continue; }
        if (!heal && narrated < 1 && !NARRATION_WORDS.test(sentence.replace(/\beach other\b/g, ""))) { narrated++; continue; }
        return null;
    }
    if (!heal) return null;
    return { turnHealing: { targets: count[2] ? 2 : 1, componentId: components[0].id, formula: components[0].formula,
        durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), endsForHostile, sourceText: heal } };
}

// A Hit Point transfer from the caster to its target: Spirit Link — "When you Cast this Spell and at the start of each of your turns, if
// the target is below maximum Hit Points, it regains 2 Hit Points (or the difference between its current and maximum Hit Points, if
// that's lower). You lose as many Hit Points as the target regained." The rest (no modifiers, temporary Hit Points ignored, Dismiss,
// ends at 0 Hit Points) is how the module moves them.
const TRANSFER = /^When you Cast this Spell and at the start of each of your turns, if the target is below maximum Hit Points, it regains (\d+) Hit Points \(or the difference between its current and maximum Hit Points, if that's lower\)\.$/;
const TRANSFER_LOSS = /^You lose as many Hit Points as the target regained\.$/;
const TRANSFER_RULES = [
    /^This is a spiritual transfer, so no effects apply that would increase the Hit Points the target regains or decrease the Hit Points you lose\.$/,
    /^This transfer also ignores any temporary Hit Points you or the target have\.$/,
    /^Since this effect doesn't involve vitality or void energy, [a-z ]+ works even if you or the target is undead\.$/,
    /^While the duration persists, you gain no benefit from regeneration or fast healing\.$/,
    /^You can Dismiss this spell, and if you're ever at 0 Hit Points, [a-z ]+ ends automatically\.$/
];
const TRANSFER_HEIGHTENED = /<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The number of Hit Points transferred each time increases by (\d+)\./;

/** Returns {hpTransfer} or null. */
export function compileHpTransfer(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || !/^(?:1|one) willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!duration) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const sentences = htmlToPlainText(stripHeighteningHTML(html)).replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let amount = null, loss = false, narrated = 0;
    const notes = [];
    for (const sentence of sentences) {
        const match = TRANSFER.exec(sentence);
        if (match && amount == null) { amount = Number(match[1]); continue; }
        if (TRANSFER_LOSS.test(sentence) && amount != null) { loss = true; continue; }
        if (TRANSFER_RULES.some(pattern => pattern.test(sentence)) && amount != null) { notes.push(sentence); continue; }
        if (amount == null && narrated < 1 && !NARRATION_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    const heightened = TRANSFER_HEIGHTENED.exec(html);
    const otherHeightening = /<strong>\s*Heightened\b/i.test(html.replace(TRANSFER_HEIGHTENED, ""));
    if (amount == null || !loss || otherHeightening) return null;
    return { hpTransfer: { amount, heightening: heightened ? { interval: Number(heightened[1]), increase: Number(heightened[2]) } : null,
        durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), endsAtZero: notes.some(note => /0 Hit Points/.test(note)), notes } };
}

// A weapon that discharges at the end of its wielder's turn, scaled by the Strikes that hit: Echoing Weapon — "If a creature is wielding
// the weapon at the end of its turn, the weapon discharges a burst of sound targeting one creature adjacent to the wielder. The sonic
// damage dealt is equal to the number of successful Strikes …" with "1: @Damage[…], 2: …, 3: …, 4: …". One Retaliate control that asks
// how many Strikes hit.
const DISCHARGE = /^If a creature is wielding the weapon at the end of its turn, the weapon discharges a burst of [a-z]+ targeting one creature adjacent to the wielder\.$/;
const BY_COUNT = /^The ([a-z]+) damage dealt is equal to the number of successful Strikes with the target weapon that the wielder made that turn \(to a maximum of (\d) [a-z]+ damage if the wielder hits with [a-z]+ Strikes\)\.$/;
const COUNT_LIST = /^(?:\d: @Damage\[\([^\[\]]+\)\[[a-z]+\]\],? ?)+$/;
const COUNT_HEIGHTENED = /^The [a-z]+ damage increases by 1 per Strike \(and the maximum damage increases by \d\)\.$/;

/** Returns {retaliation} (one count-scaled trigger) or null. */
export function compileDischarge(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || !/^(?:1|one) weapon$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!duration || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const heightened = [...html.matchAll(/<strong>\s*Heightened[^<]*<\/strong>([^<]*)/g)].map(match => match[1].trim());
    if (heightened.some(text => !COUNT_HEIGHTENED.test(text))) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(html)).split(/\n|(?<=[.!?])\s+(?=[A-Z@\d])/).map(sentence => sentence.trim()).filter(Boolean);
    let discharge = null, byCount = null, formulas = null, narrated = 0;
    for (const sentence of sentences) {
        if (DISCHARGE.test(sentence)) { discharge = sentence; continue; }
        const count = BY_COUNT.exec(sentence);
        if (count && discharge) { byCount = { type: count[1], maximum: Number(count[2]), sentence }; continue; }
        if (COUNT_LIST.test(sentence) && byCount) {
            formulas = [...sentence.matchAll(/(\d): @Damage\[(\([^\[\]]+\))\[([a-z]+)\]\]/g)].map(match => ({ count: Number(match[1]), formula: match[2], type: match[3] }));
            continue;
        }
        if (!discharge && narrated < 1 && !/\d|@|\b(?:damage|save|bonus|penalty|condition)\b/i.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!discharge || !byCount || !formulas || formulas.length !== byCount.maximum || formulas.some((entry, index) => entry.count !== index + 1 || entry.type !== byCount.type || !readsRank(entry.formula))) return null;
    return { retaliation: { triggers: [{ trigger: "The wielder's turn ends: one creature adjacent to the wielder, for the Strikes that hit with the weapon this turn.",
        damage: { byCount: formulas.map(entry => entry.formula), type: byCount.type }, sourceText: `${discharge} ${byCount.sentence}` }],
        durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), shortenPerHit: false, sourceText: `${discharge} ${byCount.sentence}` } };
}

// Damage shared with the caster: Life Link — "When you first Cast the Spell, the target recovers 1d4 Hit Points. The first time each
// round that the target takes damage, reduce the damage it takes by 3 (…). You lose 3 Hit Points each time, or the total damage dealt,
// if less than 3; …" with fixed-rank Heightened entries for the targets, healing and amount.
const SHARE_INIT = /^When you first Cast the Spell, the target recovers (\d+d\d+) Hit Points\.$/;
const SHARE = /^The first time each round that the target takes damage, reduce the damage it takes by (\d+) \(to a minimum of 0 damage\)\.$/;
const SHARE_LOSS = /^You lose (\d+) Hit Points each time, or the total damage dealt, if less than (\d+); this damage ignores any immunities or resistances you have and can't otherwise be mitigated in any way\.$/;
const SHARE_ENDS = [/^The spell ends immediately if you fall Unconscious\.$/, /^You can Dismiss the spell\.$/];
const SHARE_HEIGHTENED = /^You can target (two|three|four|\d) creatures other than you\. The initial healing increases to (\d+d\d+) Hit Points and the maximum damage reduced and Hit Points lost increases to (\d+)\.$/;
const WORDS = { two: 2, three: 3, four: 4 };

/** Returns {damageShare} or null. */
export function compileDamageShare(adapted) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || !/^(?:1|one) creature other than you$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    if (!duration || components.length !== 1 || !components[0].kinds?.includes("healing")) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const sentences = htmlToPlainText(stripHeighteningHTML(html)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let init = null, amount = null, loss = false, endsUnconscious = false, narrated = 0;
    for (const sentence of sentences) {
        let match;
        if ((match = SHARE_INIT.exec(sentence))) { if (match[1] !== String(components[0].formula).replace(/\s+/g, "")) return null; init = sentence; continue; }
        if ((match = SHARE.exec(sentence)) && init) { amount = Number(match[1]); continue; }
        if ((match = SHARE_LOSS.exec(sentence)) && amount != null) { if (Number(match[1]) !== amount || Number(match[2]) !== amount) return null; loss = true; continue; }
        if (SHARE_ENDS.some(pattern => pattern.test(sentence)) && loss) { if (/Unconscious/.test(sentence)) endsUnconscious = true; continue; }
        if (!init && narrated < 1 && !NARRATION_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!init || !loss) return null;
    const ranks = [{ rank: 0, targets: 1, amount }];
    for (const match of html.matchAll(/<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([^<]*)/g)) {
        const entry = SHARE_HEIGHTENED.exec(match[2].replace(/\s+/g, " ").trim());
        if (!entry) return null;
        ranks.push({ rank: Number(match[1]), targets: WORDS[entry[1]] ?? Number(entry[1]), amount: Number(entry[3]) });
    }
    return { damageShare: { ranks, endsUnconscious, durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), sourceText: sentences.join(" ") } };
}

// A retaliation alongside rules PF2e's linked Effect carries (Unusual Anatomy): "This has three effects:" / "You gain resistance 10 to precision
// damage and resistance 10 to extra damage from critical hits. …" / "You gain darkvision." / "Acid oozes from your skin. Any creature that hits
// you with an unarmed attack or with a non-reach melee weapon takes 2d6 acid damage." with "Heightened (+2) The resistances increase by 5, and the
// acid damage increases by 1d6." — every sentence but the retaliation (and narration) proved against the Effect's rules (the effect-note proof),
// the damage clause of the Heightened entry matching the item's own step. The Effect is the marker; Retaliate deals the damage.
const PROVEN_HIT = new RegExp(String.raw`^Any creature that hits you with an unarmed attack or with a non-reach melee weapon takes ${DICE} ([a-z]+) damage\.$`);
const PROVEN_STEP = /^(.+?), and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/;

/** Returns {retaliation} or null when the shape is this one, undefined otherwise. */
function compileProvenMarker(adapted, nativeSpellEffects) {
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (linked.length !== 1 || linked[0].resolutionStatus !== "resolved" || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return undefined;
    const rules = linked[0].document?.mechanics?.rules ?? [];
    if (!rules.length || (rules.length === 1 && rules[0].key === "Aura")) return undefined;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i);
    const sentences = htmlToPlainText(body.replace(/<\/li>/gi, " </li>")).replace(/\s+/g, " ").trim().split(/(?<=[.!?:])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const hits = sentences.map(sentence => PROVEN_HIT.exec(sentence));
    if (hits.filter(Boolean).length !== 1) return undefined;
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const hit = hits.find(Boolean);
    const component = components.length === 1 && !components[0].category ? components[0] : null;
    if (!duration || adapted.lifecycle?.sustained || !component || String(component.formula).replace(/\s+/g, "") !== hit[1] || String(component.type).toLowerCase() !== hit[2]) return null;
    // The Heightened entry: its damage clause is the item's own step (PF2e heightens the damage); the rest is the Effect's.
    const entries = [...rest.join("<hr>").matchAll(/<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*([^<]+)/gi)];
    if (entries.length > 1 || rest.join("").replace(/<strong>\s*Heightened[\s\S]*?<\/p>/i, "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}\s*<\/p>/i, "").replace(/<[^>]+>|\s/g, "")) return null;
    const heightened = [];
    if (entries.length) {
        const step = PROVEN_STEP.exec(entries[0][2].trim());
        const height = adapted.heightening;
        if (!step || step[2] !== hit[2] || height?.type !== "interval" || Number(height.interval) !== Number(entries[0][1]) || height.damage?.[component.id] !== `${step[3]}d${step[4]}`) return null;
        heightened.push({ step: Number(entries[0][1]), text: `${step[1]}.` });
    }
    // Narration (no rule words) is set aside; the rest must all be proved against the Effect.
    const others = sentences.filter((sentence, index) => !hits[index] && (NARRATION_WORDS.test(sentence) || /\b(?:you gain|you become|you are)\b/i.test(sentence)));
    const proof = proveEffectNote({ ...adapted, descriptionHTML: `<p>${others.join(" ")}</p>` }, { heightened }, linked[0].document);
    if (!proof || proof.claims.some(claim => claim.recipient && claim.recipient.actor !== "source")) return null;
    const trigger = { trigger: "A creature hits the bearer with an unarmed attack or a non-reach melee weapon.", damage: { componentId: component.id, formula: hit[1], type: hit[2] }, sourceText: sentences[hits.indexOf(hit)] };
    return { retaliation: { triggers: [trigger], durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), shortenPerHit: false,
        sourceText: trigger.sourceText, effect: { uuid: linked[0].uuid, label: linked[0].label }, proven: proof.claims.map(claim => claim.sentence) } };
}

// A holy body (Consecrate Flesh): "You have weakness 5 to unholy." / "Any creature that touches or damages you with an unarmed attack or non-reach melee
// weapon takes 1d6 spirit damage." / "Your unarmed attacks deal an additional 1 spirit damage." / "Your healing spells that restore Hit Points restore an
// additional @Damage[(max(1,floor(@item.rank/3)))d4[healing]] Hit Points when you initially cast them; as normal, …" with "Heightened (+3) Creatures
// touching you take 1d6 additional spirit damage, your unarmed Strikes deal 1 additional spirit damage, your healing spells restore 1d4 more additional
// Hit Points, and your weakness to unholy increases by 5." and PF2e's Effect (the weakness "max(5,floor(@item.level/3)*5)" and the unarmed spirit
// "max(1,floor(@item.level/3))"): PF2e's Effect as the marker, plus the text's healing dice on the caster's spell healing (PF2e's `spell-healing`
// selector, the inline roll's formula); Retaliate deals the item's damage (heightened by PF2e's interval) to the toucher.
const HOLY = {
    weakness: /^You have weakness (\d+) to ([a-z]+)\.$/,
    touch: /^Any creature that touches or damages you with an unarmed attack or non-reach melee weapon takes (\d+d\d+) ([a-z]+) damage\.$/,
    unarmed: /^Your unarmed attacks deal an additional (\d+) ([a-z]+) damage\.$/,
    healing: /^Your healing spells that restore Hit Points restore an additional @Damage\[\(max\(1,floor\(@item\.rank\/(\d)\)\)\)d(\d+)\[healing\]\] Hit Points when you initially cast them; as normal, if your healing spell restores Hit Points more than once, grants fast healing, or the like, the additional Hit Points still only apply once\.$/
};
const HOLY_STEP = /^Heightened \(\+(\d)\) Creatures touching you take (\d+)d(\d+) additional ([a-z]+) damage, your unarmed Strikes deal (\d+) additional ([a-z]+) damage, your healing spells restore (\d+)d(\d+) more additional Hit Points, and your weakness to ([a-z]+) increases by (\d+)\.$/;
function compileConsecratedBody(adapted, nativeSpellEffects) {
    const linked = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const sentences = paragraphs.filter(paragraph => !/^@UUID\[Compendium\.pf2e\.spell-effects\./.test(paragraph)).flatMap(paragraph => paragraph.replace(/<[^>]+>/g, "").split(/(?<=[.!?])\s+(?=[A-Z@])/)).map(sentence => sentence.trim()).filter(Boolean);
    if (!sentences.some(sentence => HOLY.touch.test(sentence))) return undefined;
    if (linked.length !== 1 || linked[0].resolutionStatus !== "resolved" || String(adapted.targeting?.target ?? "").trim().toLowerCase() !== "self" && String(adapted.targeting?.target ?? "").trim()) return null;
    const claimed = Object.fromEntries(Object.entries(HOLY).map(([key, pattern]) => [key, sentences.find(sentence => pattern.test(sentence))]));
    const narration = sentences.filter(sentence => !Object.values(claimed).includes(sentence));
    const duration = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const components = adapted.damageComponents ?? [];
    if (Object.values(claimed).some(sentence => !sentence) || narration.length > 1 || narration.some(sentence => NARRATION_WORDS.test(sentence)) || !duration || components.length !== 1) return null;
    const weakness = HOLY.weakness.exec(claimed.weakness), touch = HOLY.touch.exec(claimed.touch), unarmed = HOLY.unarmed.exec(claimed.unarmed), healing = HOLY.healing.exec(claimed.healing);
    const step = HOLY_STEP.exec(rest.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const component = components[0], height = adapted.heightening;
    const rank = Number(adapted.rank);
    // The Heightened entry: each clause the step of what it raises (PF2e's interval for the touch damage; the Effect's and the inline roll's formulas).
    if (!step || String(component.formula).replace(/\s+/g, "") !== touch[1] || String(component.type).toLowerCase() !== touch[2] || step[4] !== touch[2] || step[6] !== unarmed[2] || step[9] !== weakness[2]
        || height?.type !== "interval" || Number(height.interval) !== Number(step[1]) || height.damage?.[component.id] !== `${step[2]}d${step[3]}` || Number(healing[1]) !== Number(step[1])
        || healing[2] !== step[8] || Number(step[7]) !== 1 || Math.floor(rank / Number(step[1])) !== 1) return null;
    const rules = linked[0].document?.mechanics?.rules ?? [];
    const weak = rules.find(rule => rule.key === "Weakness"), flat = rules.find(rule => rule.key === "FlatModifier");
    const formula = value => String(value).replace(/\s+/g, "");
    if (rules.length !== 2 || weak?.type !== weakness[2] || formula(weak.value) !== `max(${weakness[1]},floor(@item.level/${step[1]})*${step[10]})` || flat?.selector !== "unarmed-damage"
        || flat.damageType !== unarmed[2] || formula(flat.value) !== `max(${unarmed[1]},floor(@item.level/${step[1]}))` || Number(step[5]) !== Number(unarmed[1])) return null;
    const trigger = { trigger: "A creature touches the bearer or damages it with an unarmed attack or a non-reach melee weapon.", damage: { componentId: component.id, formula: touch[1], type: touch[2] }, sourceText: claimed.touch };
    return { retaliation: { triggers: [trigger], durationSeconds: Number(duration[1]) * (duration[2].toLowerCase() === "minute" ? 60 : 6), shortenPerHit: false, sourceText: claimed.touch,
        effect: { uuid: linked[0].uuid, label: linked[0].label }, proven: [claimed.weakness, claimed.unarmed],
        ruleAdditions: [{ key: "DamageDice", selector: "spell-healing", diceNumber: `max(1,floor(@item.level/${healing[1]}))`, dieSize: `d${healing[2]}`, label: linked[0].label,
            predicate: ["item:type:spell"] }],
        notes: ["The extra healing applies only when a healing spell first restores Hit Points (not to its later healing or fast healing)."] } };
}
