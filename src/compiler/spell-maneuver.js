// An athletic maneuver made with a spell attack roll (Telekinetic Maneuver, Vanish Weapon):
//   "You can attempt to Disarm, Shove, Reposition, or Trip the target using a spell attack roll instead of an Athletics check." /
//   "You attempt to Disarm the triggering creature using a melee spell attack roll instead of an Athletics check."
// Casting posts a card offering the named maneuvers. Each rolls PF2e's own action with the spell's spellcasting statistic against the target,
// and the module applies what PF2e's action states: Trip (Prone; a critical success also 1d6 bludgeoning; a critical failure knocks the caster
// Prone), Disarm (PF2e's Effect: Disarm (Success); a critical failure leaves the caster off-guard until the start of its next turn), Shove and
// Reposition (the distance is the GM's; Shove's critical failure knocks the caster Prone). Vanish Weapon's extradimensional space, and the
// rest the GM plays, are notes on the card.
import { htmlToPlainText } from "./description-parser.js";

const NAMES = "Disarm|Shove|Reposition|Trip";
const MANEUVER = new RegExp(String.raw`^You (?:can )?attempt to ((?:${NAMES})(?:, (?:${NAMES}))*(?:,? or (?:${NAMES}))?) (the target|the triggering creature) using an? (melee )?spell attack roll instead of an Athletics check\.$`);
// Vanish Weapon's other sentences: the weapon's extradimensional space and its end, for the GM.
const NOTES = [
    /^You don't need a hand free for this attempt\.$/,
    /^If you successfully knock the weapon from the triggering creature's grasp, it disappears into your extradimensional space\.$/,
    /^You can Interact to draw the weapon as if you were wearing it; if you do so, the spell ends\.$/,
    /^If the weapon is still in the extradimensional space when the spell ends, it falls to the ground at your feet\.$/,
    /^You can Dismiss this spell\.$/,
    /^This reaction doesn't prevent damage from a successful Strike\.$/
];
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|rounds?|minutes?)\b/i;

/** Returns {spellManeuver, claimed} or null. */
export function compileSpellManeuver(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length) return null;
    const target = String(adapted.targeting?.target ?? "").trim();
    if (!/^(?:1 creature|the triggering creature)$/i.test(target)) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    // A reaction's Trigger paragraph comes first.
    const trigger = /^<p>\s*<strong>\s*Trigger\s*<\/strong>\s*([\s\S]*?)<\/p>$/i.exec(sections[0] ?? "");
    const body = trigger ? sections.slice(1) : sections;
    if (body.length !== 1) return null;
    const plain = htmlToPlainText(body[0]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\[\[\/act ([a-z-]+)\]\]/g, (_, slug) => slug[0].toUpperCase() + slug.slice(1));
    const sentences = plain.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    let maneuver = null, narrated = 0;
    const notes = [], claimed = [];
    for (const sentence of sentences) {
        const match = !maneuver ? MANEUVER.exec(sentence) : null;
        if (match) {
            maneuver = { actions: match[1].split(/,? or |, /).map(name => name.toLowerCase()), melee: !!match[3] };
            if ((match[2] === "the triggering creature") !== !!trigger) return null;
            claimed.push(sentence); continue;
        }
        if (maneuver && NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); claimed.push(sentence); continue; }
        if (!maneuver && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!maneuver || new Set(maneuver.actions).size !== maneuver.actions.length) return null;
    return { spellManeuver: { ...maneuver, ...(trigger ? { trigger: htmlToPlainText(trigger[1]).replace(/\s+/g, " ").trim() } : {}), notes }, claimed };
}
