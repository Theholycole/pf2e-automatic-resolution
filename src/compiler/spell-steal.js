// Stealing a spell off a foe (Umbral Graft): "During umbral graft's duration, you can use the Steal action to attempt to abscond with spells affecting a foe
// instead of stealing an item. You can also make one attempt to Steal as part of Casting umbral graft. If you succeed at your check to Steal a spell, randomly
// determine a spell affecting the foe that has a target entry. That spell ceases to affect the target, and you can either cause the spell to affect you or store it
// in your shadow. If your attempt to Steal was a critical success, you automatically steal the spell if its rank is equal to or lower than umbral graft. If it was
// a success, you automatically steal it if its rank is lower than umbral graft. If you succeeded, but the spell's rank was too high to steal automatically, you must
// attempt a counteract check to see if you steal the spell. … If you store it, you can transfer it to a willing creature as a single action that has the
// manipulate trait. The spell lasts for its remaining duration, to a maximum of 1 minute, and any time you keep it stored subtracts from its duration normally. The
// spell gains the shadow trait." / "… Once you've stolen a spell, you can't attempt to Steal more spells … When you cast umbral graft, any spells you stole with a
// previous umbral graft end even if their duration hasn't elapsed. …" — the caster's Effect for the duration with the card's Steal (PF2e's Thievery against the
// foe's Perception DC): a random spell Effect on the foe whose spell has a target entry, kept by the rank rule or the caster's counteract check; then the caster's
// own (at most 1 minute) or stored (transferable); the excluded innate spells and the other notes the GM's.
import { htmlToPlainText } from "./description-parser.js";

const RULES = {
    steal: /^During [a-z ]+'s duration, you can use the Steal action to attempt to abscond with spells affecting a foe instead of stealing an item\.$/,
    onCast: /^You can also make one attempt to Steal as part of Casting [a-z ]+\.$/,
    random: /^If you succeed at your check to Steal a spell, randomly determine a spell affecting the foe that has a target entry\.$/,
    take: /^That spell ceases to affect the target, and you can either cause the spell to affect you or store it in your shadow\.$/,
    critical: /^If your attempt to Steal was a critical success, you automatically steal the spell if its rank is equal to or lower than [a-z ]+\.$/,
    success: /^If it was a success, you automatically steal it if its rank is lower than [a-z ]+\.$/,
    counteract: /^If you succeeded, but the spell's rank was too high to steal automatically, you must attempt a counteract check to see if you steal the spell\.$/,
    known: /^You know what the spell is as soon as you steal it\.$/,
    transfer: /^If you store it, you can transfer it to a willing creature as a single action that has the manipulate trait\.$/,
    lasts: /^The spell lasts for its remaining duration, to a maximum of (\d+) minutes?, and any time you keep it stored subtracts from its duration normally\.$/,
    trait: /^The spell gains the ([a-z]+) trait\.$/,
    reach: /^As normal, you can Steal only from a target within your reach\.$/,
    once: /^Once you've stolen a spell, you can't attempt to Steal more spells, nor can you choose not to take a spell if you succeed at your Thievery check\.$/,
    recast: /^When you cast [a-z ]+, any spells you stole with a previous [a-z ]+ end even if their duration hasn't elapsed\.$/
};
const NOTES = [/^You can't steal constant innate spells that are always active on a creature, such as .+\.$/, /^At the GM's discretion, you might not be able to steal innate spells with other unusual modifications to the base spell\.$/,
    /^If you're affected by both [a-z ]+ and [a-z ]+, you make the choice whether to steal a spell slot, an active spell, or an item each time you Steal\.$/];

/** {spellSteal, claimed} or null. */
export function compileSpellSteal(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim()) return null;
    const rounds = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!rounds || /<hr/i.test(String(adapted.descriptionHTML ?? ""))) return null;
    const sentences = htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const claimed = {}, notes = [];
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = sentence; continue; }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty|Steal)\b/.test(sentence)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    return { spellSteal: { seconds: Number(rounds[1]) * 6, maxMinutes: Number(RULES.lasts.exec(claimed.lasts)[1]), trait: RULES.trait.exec(claimed.trait)[1], notes },
        claimed: sentences };
}
