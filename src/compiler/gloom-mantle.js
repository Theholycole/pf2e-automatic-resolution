// A sustained spell that renews a condition on the caster (Gloom Mantle, PF2e 8.6):
//   "You shroud yourself in shadow." / "When you Cast this Spell and the first time each round you Sustain it, you become {Concealed} until the end of your next
//   turn, though you can't use this concealment to [[/act hide]] or [[/act sneak]]." / "You lose this concealment if you're ever in an area of bright light."
// Casting starts a sustained record: the caster's Effect granting the condition until the end of its next turn, made again the first time each round it's
// Sustained; what it can't be used for and the bright light are its note (the GM's).
import { htmlToPlainText } from "./description-parser.js";

const RENEW = /^When you Cast this Spell and the first time each round you Sustain it, you become @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Concealed|Hidden|Invisible)\} until the end of your next turn, though you can't use this concealment to (?:\[\[\/act ([a-z]+)\]\]|([A-Z][a-z]+)) or (?:\[\[\/act ([a-z]+)\]\]|([A-Z][a-z]+))\.$/;
const LOSE = /^You lose this concealment if you're ever in an area of bright light\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|must|each|concealed|hidden|light)\b/i;

/** Returns {selfPulse, claimed} or null. */
export function compileSelfPulse(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()
        || String(adapted.targeting?.range ?? "").trim() || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const html = String(adapted.descriptionHTML ?? "");
    if (!minutes || /<hr\b|Heightened/i.test(html)) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => RENEW.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 2 || !LOSE.test(sentences[at + 1]) || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const renew = RENEW.exec(sentences[at]);
    const actions = [renew[3] ?? renew[4], renew[5] ?? renew[6]].map(action => `${action[0].toUpperCase()}${action.slice(1)}`);
    return {
        selfPulse: { condition: { uuid: renew[1], slug: renew[2].toLowerCase(), name: renew[2] }, durationSeconds: Number(minutes[1]) * 60,
            note: `It can't use this ${renew[2].toLowerCase()} condition to ${actions[0]} or ${actions[1]}, and loses it in an area of bright light (the GM).`,
            sourceText: [sentences[at], sentences[at + 1]] },
        claimed: sentences
    };
}
