// A spell whose only rules are stated check bonuses (note-only before): Fashionista, Groom Companion, Root Reading.
//   "The target gains a +1 status bonus on Deception checks to Create a Diversion." / "Your companion gains a +1 status bonus to Performance
//   checks." / "… you gain a +1 status bonus to this attempt and any of your other attempts to Seek Hidden or undetected creatures until the end
//   of your next turn." / "If you begin to Track a creature detected in this way, you gain a +1 status bonus to the initial check." with
//   "Heightened (+2) The status bonus increases by 1, to a maximum of +4 at 7th rank."
// Casting creates the module's Effect on the recipient (the target, the companion, or the caster) with a FlatModifier per bonus (predicated
// on the action where one is named), for the spell's duration or the stated time; a bonus for one initial check is removed after that check.
// The other sentences (appearance, what the GM decides) are notes on the Effect.
import { htmlToPlainText } from "./description-parser.js";

const SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation", "medicine", "nature", "occultism", "performance",
    "religion", "society", "stealth", "survival", "thievery"];
const slug = text => text.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const STATED = /^(The target|Your companion) gains a \+(\d) (status|circumstance|item) bonus (?:on|to) ([A-Z][a-z]+) checks(?: to ((?:@UUID\[[^\]]+\]\{[^}]+\})|[A-Z][a-z]+(?: an?)?(?: [A-Z][a-z]+)*))?\.$/;
const SEEK = /^You can immediately attempt to (?:@UUID\[[^\]]+\]\{Seek\}|Seek) an undetected creature, and you gain a \+(\d) status bonus to this attempt and any of your other attempts to Seek (?:@UUID\[[^\]]+\]\{Hidden\}|Hidden) or (?:@UUID\[[^\]]+\]\{undetected\}|undetected) creatures until the end of your next turn\.$/;
const TRACK = /^If you begin to (?:@UUID\[[^\]]+\]\{Track\}|Track) a creature detected in this way, you gain a \+(\d) status bonus to the initial check\.$/;
const DISMISS = /^You can Dismiss this spell\.$/;
const GM_NOTE = /\b(?:At the GM's discretion|you learn of their presence|You also learn if any such creatures passed through)\b/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The status bonus increases by 1, to a maximum of \+(\d) at (\d+)(?:st|nd|rd|th) rank\.\s*<\/p>$/;
const RULE_WORDS = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|checks?|DC|Hit Points|terrain)\b/i;

/** Returns {bonusEffect, claimed} or null. */
export function compileBonusEffect(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    const recipient = /^1 willing creature$/i.test(target) ? "target" : /^your companion or eidolon$/i.test(target) ? "companion" : !target ? "self" : null;
    if (!recipient) return null;
    const duration = String(adapted.lifecycle?.duration ?? "").trim();
    const fixed = /^(\d+) (minute|hour)s?$/i.exec(duration);
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const bonuses = [], notes = [], claimed = [];
    let dismissible = false;
    for (const sentence of sentences) {
        const stated = STATED.exec(sentence);
        if (stated && ((stated[1] === "The target") === (recipient === "target")) && SKILLS.includes(stated[4].toLowerCase())) {
            const action = stated[5] ? slug(stated[5].replace(/@UUID\[[^\]]+\]\{([^}]+)\}/, "$1")) : null;
            bonuses.push({ selector: stated[4].toLowerCase(), type: stated[3], value: Number(stated[2]), ...(action ? { predicate: [`action:${action}`] } : {}), duration: "spell" });
            claimed.push(sentence); continue;
        }
        const seek = recipient === "self" ? SEEK.exec(sentence) : null;
        if (seek) { bonuses.push({ selector: "perception", type: "status", value: Number(seek[1]), predicate: ["action:seek"], duration: "until-end-of-next-turn" }); claimed.push(sentence); continue; }
        const track = recipient === "self" ? TRACK.exec(sentence) : null;
        if (track) { bonuses.push({ selector: "survival", type: "status", value: Number(track[1]), predicate: ["action:track"], duration: "next-check", consume: "action:track" }); claimed.push(sentence); continue; }
        if (DISMISS.test(sentence)) { dismissible = true; claimed.push(sentence); continue; }
        if (GM_NOTE.test(sentence)) { notes.push(sentence.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")); claimed.push(sentence); continue; }
        if (!RULE_WORDS.test(sentence)) { notes.push(sentence); continue; }
        return null;
    }
    if (!bonuses.length) return null;
    if (bonuses.some(bonus => bonus.duration === "spell") && !fixed) return null;
    if (!fixed && duration) return null;
    let step = null;
    if (rest.length) {
        const raised = HEIGHTENED.exec(rest[0]);
        if (!raised || bonuses.length !== 1) return null;
        step = { interval: Number(raised[1]), max: Number(raised[2]) };
    }
    return {
        bonusEffect: { recipient, bonuses, step, dismissible, spellSeconds: fixed ? Number(fixed[1]) * (fixed[2].toLowerCase() === "hour" ? 3600 : 60) : null, notes },
        claimed: [...claimed, ...(rest.length ? [htmlToPlainText(rest[0]).trim()] : [])]
    };
}

/** A bonus's value at a cast rank (the Heightened step: +1 per interval, to the maximum). */
export function bonusValueAt(data, bonus, castRank, baseRank = 1) {
    if (!data.step) return bonus.value;
    return Math.min(data.step.max, bonus.value + Math.floor(Math.max(0, castRank - baseRank) / data.step.interval));
}
