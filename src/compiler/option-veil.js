// An illusion whose benefit is one of a list chosen when cast, disbelieved by touch (Falsify Heat; user decision 2026-10-01: a Disbelieve control):
//   "This illusion applies to all senses, and a creature that touches the target can attempt to disbelieve the illusion." / "You can Dismiss the
//   spell." / "Choose an illusory body temperature when you cast the spell." with the list "<strong>Moderate</strong> … giving the target a +2
//   circumstance bonus to Deception checks to Impersonate an undead, a cold-blooded creature, or an inanimate object (such as a corpse). The
//   target is also Invisible to heatvision and other abilities that sense heat similarly." / "<strong>Warm</strong> … gaining a +2 circumstance
//   bonus to Deception checks to Impersonate a warm-blooded creature." and "Heightened (4th) You can target up to 10 creatures, and you can
//   choose a different body temperature for each of them."
// Each target gets a generated Effect for its option: the Deception bonus on Impersonate checks, behind a toggle naming what it impersonates (PF2e
// can't tell); the sense the target is invisible to is the Effect's note. A Dismissable Ongoing record holds them for the duration; its
// control rolls a touching creature's Perception against the spell DC (whispered to the GM and the caster).
import { htmlToPlainText } from "./description-parser.js";
import { DISMISS_THE as DISMISS, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const SENSES = /^This illusion applies to all senses, and a creature that touches the target can attempt to disbelieve the illusion\.$/;
const CHOOSE = /^Choose an illusory ([a-z ]+) when you cast the spell\.$/;
const BONUS = /(?:giving the target|gaining) a \+(\d) (circumstance|status) bonus to (Deception) checks to (?:@UUID\[[^\]]+\]\{Impersonate\}|Impersonate) (an? [a-z-]+(?: creature)?(?:, an? [a-z-]+ creature)?(?:, or an? [a-z ]+)?(?: \(such as an? [a-z]+\))?)\.$/;
const INVISIBLE = /^The target is also (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Invisible\}) to ([a-z]+) and other abilities that sense ([a-z]+) similarly\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*You can target up to (\d+) creatures, and you can choose a different ([a-z ]+) for each of them\.\s*<\/p>$/;

/** Returns {optionVeil, claimed} or null. */
export function compileOptionVeil(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || !/^1 willing creature or object$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const hours = /^(\d+) hours?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (!hours || adapted.lifecycle?.sustained || !(adapted.activation?.traits ?? []).includes("illusion")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(body);
    if (!list || rest.length !== 1 || body.slice(list.index + list[0].length).trim()) return null;
    const sentences = htmlToPlainText(body.slice(0, list.index)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => SENSES.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const choose = CHOOSE.exec(sentences[at + 2]);
    if (!DISMISS.test(sentences[at + 1]) || !choose) return null;
    const options = [];
    for (const item of [...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>([\s\S]*?)<\/li>/gi)]) {
        const name = item[1].trim();
        const parts = htmlToPlainText(item[2]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
        const bonus = BONUS.exec(parts[0] ?? "");
        // (The first sentence is the option's look, ending in its bonus; an optional second says what it's invisible to.)
        const invisible = parts[1] ? INVISIBLE.exec(parts[1]) : null;
        if (!bonus || parts.length > 2 || (parts[1] && !invisible)) return null;
        if (NARRATION_RULES.test(parts[0].slice(0, bonus.index).replace(/,\s*$/, ""))) return null;
        options.push({ name, bonus: { value: Number(bonus[1]), type: bonus[2], skill: bonus[3].toLowerCase(), action: "impersonate", as: bonus[4] },
            ...(invisible ? { note: `Invisible to ${invisible[2]} and other abilities that sense ${invisible[3]} similarly (PF2e has no such sense: the GM applies it).`, noteText: parts[1] } : {}),
            sourceText: parts.join(" ") });
    }
    if (options.length < 2 || new Set(options.map(option => option.name)).size !== options.length) return null;
    const heightened = HEIGHTENED.exec(rest[0]);
    if (!heightened || heightened[3] !== choose[1]) return null;
    return {
        optionVeil: { label: choose[1], options, durationSeconds: Number(hours[1]) * 3600, dismissible: true,
            targets: [{ rank: Number(adapted.rank), limit: 1, objects: true }, { rank: Number(heightened[1]), limit: Number(heightened[2]), objects: false, eachDifferent: true }],
            disbelieve: { by: "touch", statistic: "perception", sourceText: sentences[at] } },
        claimed: [...sentences.slice(at), ...options.map(option => option.sourceText), htmlToPlainText(rest[0]).trim()]
    };
}
