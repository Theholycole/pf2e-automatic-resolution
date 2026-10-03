// An illusory duplicate that curses its attacker (Mirror's Misfortune): "… When you cast this spell, you seem to split in two. As you do, you can Step to any
// adjacent square. In either your initial square, or another square adjacent to your initial square, an exact illusory duplicate of you appears. You decide a
// simple course of action for the duplicate to follow, … A creature can distinguish between you and the duplicate only if it spends an action to Seek and
// succeeds at a Perception check against the spell's DC." / "If a creature takes a hostile action against the duplicate, the illusion shatters …. The
// attacker must attempt a Will save with the following effects; this is a curse and misfortune effect. When the duplicate shatters, the spell ends." with rows
// "The creature is unaffected." / "Within the next hour, the creature must roll its next two attack rolls twice and take the lower result." / "… four …"
// (user decision 2026-10-01: a conjured thing is a token the module makes; what it can't detect is a GM control): the duplicate a token beside the caster
// for the spell's duration; the GM's control, with the attacker targeted, rolls its save — a failing row's misfortune on its next attack rolls (that many, for
// an hour) — and the duplicate shatters, ending the spell.
import { htmlToPlainText } from "./description-parser.js";

const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
const SPLIT = /^When you cast this spell, you seem to split in two\.$/;
const STEP = /^As you do, you can Step to any adjacent square\.$/;
const APPEARS = /^In either your initial square, or another square adjacent to your initial square, an exact illusory duplicate of you appears\.$/;
const COURSE = /^You decide a simple course of action for the duplicate to follow, [^.]+\.$/;
const SEEK = /^A creature can distinguish between you and the duplicate only if it spends an action to Seek and succeeds at a Perception check against the spell's DC\.$/;
const HOSTILE = /^If a creature takes a hostile action against the duplicate, the illusion shatters [^.]+\.$/;
const SAVE = /^The attacker must attempt an? (Fortitude|Reflex|Will) save with the following effects; this is a curse and misfortune effect\.$/;
const ENDS = /^When the duplicate shatters, the spell ends\.$/;
const ROW = /^Within the next (hour|minute), the creature must roll its next (two|three|four|five) attack rolls twice and take the lower result\.$/;
const WORDS = { two: 2, three: 3, four: 4, five: 5 };

/** Returns {mirrorDuplicate, claimed} or null. */
export function compileMirrorDuplicate(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim() || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length || adapted.lifecycle?.sustained) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => plain(match[1]));
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const at = first.findIndex(sentence => SPLIT.test(sentence));
    if (at < 0 || first.length !== at + 5 || first.slice(0, at).some(sentence => /\d|@|\b(?:save|damage|bonus|penalty|condition|must)\b/i.test(sentence))
        || !STEP.test(first[at + 1]) || !APPEARS.test(first[at + 2]) || !COURSE.test(first[at + 3]) || !SEEK.test(first[at + 4])) return null;
    const save = SAVE.exec(second[1] ?? "");
    if (second.length !== 3 || !HOSTILE.test(second[0]) || !save || !ENDS.test(second[2]) || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => plain(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "");
    const failure = ROW.exec(row("Failure")), critical = ROW.exec(row("Critical Failure"));
    if (rows.length !== 3 || row("Success") !== "The creature is unaffected." || !failure || !critical) return null;
    const misfortune = match => ({ count: WORDS[match[2]], seconds: match[1] === "hour" ? 3600 : 60, sourceText: match[0] });
    return {
        mirrorDuplicate: { statistic: save[1].toLowerCase(), durationSeconds: Number(minutes[1]) * 60,
            rows: { failure: misfortune(failure), criticalFailure: misfortune(critical) },
            notes: [`${first[at + 1]} ${first[at + 2]} The module places the duplicate on your square: move it (or Step yourself) as the text allows.`, first[at + 3], first[at + 4]] },
        claimed: [...first, ...second, row("Success"), row("Failure"), row("Critical Failure")]
    };
}
