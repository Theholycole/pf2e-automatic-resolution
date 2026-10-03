// A thrall commanded to Stride and Strike with extra damage (Thrall Charge):
//   "You command the target thrall to Stride and then make a Strike that deals an additional 1d6 damage. You can destroy the thrall as
//   part of this Strike to add a status bonus to the Strike's damage equal to this spell's rank." with fixed-rank heightening of the dice
//   ("Heightened (2nd) The additional damage increases to 2d6.").
// A generated PF2e Effect on the thrall adds the dice (of the Strike's own damage type) to its next Strike's damage and is removed after
// that damage roll; destroying the thrall (the caster's choice when casting) adds the status bonus, and the GM removes the thrall.
import { htmlToPlainText } from "./description-parser.js";

const COMMAND = /^You command the target thrall to Stride and then make a Strike that deals an additional (\d+)d(\d+) damage\.$/;
const DESTROY = /^You can destroy the thrall as part of this Strike to add a status bonus to the Strike's damage equal to this spell's rank\.$/;
const LEVEL = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The additional damage increases to (\d+)d(\d+)\.\s*<\/p>$/;

/** {thrallStrike, sentences} or null. */
export function compileThrallStrike(adapted) {
    if (!/^1 of your thralls$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length) return null;
    if (!/^\d+ feet$/.test(String(adapted.targeting?.range ?? "").trim()) || adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const base = cut < 0 ? html : html.slice(0, cut);
    const sentences = htmlToPlainText(base).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => COMMAND.test(sentence));
    if (at < 0 || !DESTROY.test(sentences[at + 1] ?? "") || sentences.length !== at + 2) return null;
    if (sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|save|bonus|penalty|condition|Strike)\b/i.test(sentence))) return null;
    const [, count, die] = COMMAND.exec(sentences[at]);
    const ranks = [{ rank: Number(adapted.rank) || 1, dice: Number(count) }];
    for (const entry of (cut < 0 ? "" : html.slice(cut)).match(/<p>\s*<strong>\s*Heightened[\s\S]*?<\/p>/gi) ?? []) {
        const level = LEVEL.exec(entry.trim());
        if (!level || level[3] !== die || Number(level[1]) <= ranks.at(-1).rank || Number(level[2]) <= ranks.at(-1).dice) return null;
        ranks.push({ rank: Number(level[1]), dice: Number(level[2]) });
    }
    return {
        thrallStrike: { dieSize: `d${die}`, ranks, destroyBonus: "rank", range: Number(/^(\d+)/.exec(adapted.targeting.range)[1]), sourceText: [sentences[at], sentences[at + 1]] },
        sentences: sentences.slice(0, at + 2)
    };
}
