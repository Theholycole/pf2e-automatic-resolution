// A sustained emanation that heals on a pulse (Garden of Healing):
//   "When you cast this spell and the first time you Sustain it on each subsequent round, you generate a pulse of renewing energy that heals
//   each creature within the emanation for 1d4 Hit Points." / "The calm of this effect lingers; once this spell ends, any creature that has
//   been affected by its healing gains a +1 circumstance bonus to saves against emotion effects for 10 minutes but does not receive any
//   healing from additional castings of the spell while the bonus persists." with the linked Effect (that bonus, 10 minutes).
// The pulse heals every creature inside when cast and on the first Sustain each round (the item's healing entry, heightened); when the spell
// ends, each creature it healed gets PF2e's Effect; a creature still holding that Effect isn't healed by another casting.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const PULSE = /^When you cast this spell and the first time you Sustain it on each subsequent round, you generate a pulse of [a-z ]+ that heals each creature within the emanation for (\d+d\d+) Hit Points\.$/i;
const AFTER = /^The calm of this effect lingers; once this spell ends, any creature that has been affected by its healing gains a \+(\d) (circumstance|status) bonus to saves against ([a-z]+) effects for (\d+) minutes but does not receive any healing from additional castings of the spell while the bonus persists\.$/;
const NARRATION_RULES = /\d|@|\b(?:damage|saves?|bonus|penalty|conditions?|heal\w*|Hit Points|Sustain|immune|can't|must|enem(?:y|ies)|allies|targets?|blinded|clumsy|concealed|confused|controlled|dazzled|deafened|doomed|drained|dying|enfeebled|fascinated|fatigued|fleeing|frightened|grabbed|hidden|immobilized|off-guard|paralyzed|petrified|prone|quickened|restrained|sickened|slowed|stunned|stupefied|unconscious|wounded)\b/i;

/** The Effect gives exactly the bonus (to saving throws against effects with that trait) for that long. */
export function proveAfterBonus(mechanics, claim) {
    const rules = mechanics?.rules ?? [], duration = mechanics?.duration ?? {};
    const [rule] = rules;
    return rules.length === 1 && rule.key === "FlatModifier" && rule.selector === "saving-throw" && rule.type === claim.type && rule.value === claim.value
        && JSON.stringify(rule.predicate) === JSON.stringify([`item:trait:${claim.trait}`]) && duration.unit === "minutes" && duration.value === claim.minutes && !duration.sustained;
}

/** Returns {healingPulse, afterEffect, claimed} or null. `links` are the spell's resolved Effect links. */
export function compileHealingPulse(adapted, links) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || area?.type !== "emanation" || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || !components[0].kinds?.includes("healing") || components[0].category) return null;
    const sentences = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const pulseAt = sentences.findIndex(sentence => PULSE.test(sentence)), afterAt = sentences.findIndex(sentence => AFTER.test(sentence));
    if (pulseAt < 0 || afterAt !== pulseAt + 1) return null;
    if (sentences.slice(0, pulseAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    if (sentences.slice(afterAt + 1).some(sentence => !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(sentence))) return null;
    const dice = PULSE.exec(sentences[pulseAt])[1];
    if (String(components[0].formula).replace(/\s+/g, "") !== dice) return null;
    // "Heightened (+1) The healing granted by the spell's pulse increases by 1d4.": the item's own heightening, the same die.
    const step = adapted.heightening?.damage?.[components[0].id];
    if (step && !(adapted.heightening.type === "interval" && /^\d+d\d+$/.test(step) && step.split("d")[1] === dice.split("d")[1])) return null;
    const heightened = [...String(adapted.descriptionHTML ?? "").matchAll(/<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The healing granted by the spell's pulse increases by (\d+d\d+)(?: Hit Points)?\.\s*<\/p>/gi)];
    if ((String(adapted.descriptionHTML ?? "").match(/<strong>\s*Heightened/gi) ?? []).length !== heightened.length || heightened.length > 1) return null;
    if (Boolean(step) !== Boolean(heightened[0]) || (step && (heightened[0][2] !== step || Number(heightened[0][1]) !== Number(adapted.heightening.interval)))) return null;
    const [, value, type, trait, minutes] = AFTER.exec(sentences[afterAt]);
    const claim = { value: Number(value), type, trait, minutes: Number(minutes) };
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved" || !proveAfterBonus(links[0].document?.mechanics, claim)) return null;
    const seconds = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!seconds) return null;
    return {
        healingPulse: { formula: dice, componentId: components[0].id, heightening: step ? { interval: Number(adapted.heightening.interval), dice: step } : null, sourceText: sentences[pulseAt] },
        afterEffect: { uuid: links[0].uuid, label: links[0].label, document: links[0].document, claim, sourceText: sentences[afterAt] },
        area: { type: area.type, value: Number(area.value) }, durationSeconds: Number(seconds[1]) * 60,
        claimed: [sentences[pulseAt], sentences[afterAt]]
    };
}
