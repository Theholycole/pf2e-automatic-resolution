// Messaging spells: the caster's words delivered to a target, with at most one reply.
//   Message: "You mouth words quietly, but instead of coming out of your mouth, they're transferred directly to the ears
//   of the target. While others can't hear your words …, the target can hear your words as if they were standing next to
//   you. The target can give a brief response as a reaction, or as a free action on their next turn if they wish, but
//   they must be able to see you and be within range to do so. If they respond, their response is delivered directly to
//   your ear, just like the original message." Heightened (3rd): "The spell's range increases to 500 feet."
//   Sending: "You send the creature a mental message of 25 words or fewer, and it can respond immediately with its own
//   message of 25 words or fewer."
//   Dream Message: "You send a message to your target's dream. The message is one-way, up to 1 minute of speech (roughly
//   150 words). If the target is asleep, they receive the message instantly. If not, they receive it the next time they
//   sleep. As soon as they receive it, the spell ends, and you know the message was sent." Heightened (4th): "You can
//   target up to 10 creatures … You must send the same message to all of them; the spell ends for each creature
//   individually"
// The module whispers the text to the target's owners (and the GM), checks the stated word limits, range and reply
// window, and holds a dream message until the GM marks the target asleep.
import { htmlToPlainText } from "./description-parser.js";
import { plainSentences as sentencesOf } from "./text-patterns.js";

const MOUTH = /^You mouth words quietly, but instead of coming out of your mouth, they're transferred directly to the ears of the target\.$/;
const PRIVATE = /^While others can't hear your words any better than if you normally mouthed them, the target can hear your words as if they were standing next to you\.$/;
const BRIEF_REPLY = /^The target can give a brief response as a reaction, or as a free action on their next turn if they wish, but they must be able to see you and be within range to do so\.$/;
const REPLY_DELIVERED = /^If they respond, their response is delivered directly to your ear, just like the original message\.$/;
const SENDING = /^You send the creature a mental message of (\d+) words or fewer, and it can respond immediately with its own message of (\d+) words or fewer\.$/;
const DREAM = /^You send a message to your target's dream\.$/;
const ONE_WAY = /^The message is one-way, up to 1 minute of speech \(roughly (\d+) words\)\.$/;
const ASLEEP_NOW = /^If the target is asleep, they receive the message instantly\.$/;
const ASLEEP_LATER = /^If not, they receive it the next time they sleep\.$/;
const DREAM_ENDS = /^As soon as they receive it, the spell ends, and you know the message was sent\.$/;
const RANGE_UP = /^The spell's range increases to (\d+) feet\.$/;
const MORE_TARGETS = /^You can target up to (\d+) creatures you know by name and have met in person\. You must send the same message to all of them; the spell ends for each creature individually\.?$/;

const feet = value => { const match = /^(\d+) feet$/.exec(String(value ?? "").trim()); return match ? Number(match[1]) : null; };

/** A messaging plan's `message` block, or null. */
export function compileMessage(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || (adapted.rules ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b/i);
    const sentences = sentencesOf(cut >= 0 ? html.slice(0, cut) : html);
    const heightened = [...(cut >= 0 ? html.slice(cut) : "").matchAll(/<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>([\s\S]*?)(?=<strong>\s*Heightened\b|$)/gi)]
        .map(([, rank, body]) => ({ rank: Number(rank), text: htmlToPlainText(body).replace(/\s+/g, " ").trim() }));
    if (cut >= 0 && !heightened.length) return null;
    const text = sentences.join(" ");
    const range = feet(adapted.targeting?.range);
    const planetary = /^planetary$/i.test(String(adapted.targeting?.range ?? "").trim());
    let message;
    // Message: words mouthed to one creature in range; a brief reply before the end of its next turn, in range.
    if (sentences.length === 4 && MOUTH.test(sentences[0]) && PRIVATE.test(sentences[1]) && BRIEF_REPLY.test(sentences[2]) && REPLY_DELIVERED.test(sentences[3])) {
        if (range == null) return null;
        message = { words: null, reply: { words: null, brief: true, window: "reaction-or-next-turn", withinRange: true }, range, delivery: "immediate", maxTargets: 1 };
    } else if (sentences.length === 1 && SENDING.test(sentences[0])) {
        const [, words, replyWords] = SENDING.exec(sentences[0]);
        if (!planetary && range == null) return null;
        message = { words: Number(words), reply: { words: Number(replyWords), brief: false, window: "immediate", withinRange: false }, range: planetary ? null : range, delivery: "immediate", maxTargets: 1 };
    } else if (sentences.length === 5 && DREAM.test(sentences[0]) && ONE_WAY.test(sentences[1]) && ASLEEP_NOW.test(sentences[2]) && ASLEEP_LATER.test(sentences[3]) && DREAM_ENDS.test(sentences[4])) {
        if (!planetary && range == null) return null;
        message = { words: Number(ONE_WAY.exec(sentences[1])[1]), wordsApproximate: true, reply: null, range: planetary ? null : range, delivery: "when-asleep", maxTargets: 1 };
    } else return null;
    // Heightened entries: a longer range, or more targets.
    message.heightened = [];
    for (const entry of heightened) {
        const up = RANGE_UP.exec(entry.text), more = MORE_TARGETS.exec(entry.text);
        if (up && message.range != null) message.heightened.push({ rank: entry.rank, range: Number(up[1]) });
        else if (more && message.delivery === "when-asleep") message.heightened.push({ rank: entry.rank, maxTargets: Number(more[1]) });
        else return null;
    }
    return { message: { ...message, sourceText: text } };
}

/** The message parameters at `castRank`. */
export function messageAtRank(message, castRank) {
    const out = { ...message };
    for (const entry of message.heightened ?? []) if (Number(castRank) >= entry.rank) Object.assign(out, entry.range != null ? { range: entry.range } : {}, entry.maxTargets != null ? { maxTargets: entry.maxTargets } : {});
    delete out.heightened;
    return out;
}

/** Words in a text, as the limits count them. */
export function wordCount(text) {
    return String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
}
