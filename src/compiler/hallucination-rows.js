// A sense the caster rewrites (Hallucination): "The target consistently detects one thing as another, can't detect something that's there, or detects
// something that's not there, though it doesn't alter their beliefs. You choose which of these effects applies, and you determine the specifics of
// the hallucination. …" / "The target can attempt an initial Will save, with effects below. They also receive a Will save to disbelieve the
// hallucination every time they Seek or directly interact with the hallucination. … The target can attempt to disbelieve with a large circumstance
// bonus in situations determined by the GM, …" with rows "… perceives what you chose until it disbelieves, but it knows what the hallucination is." /
// "… until it disbelieves." / "…, and it trusts its false senses, taking a -4 circumstance penalty to saves to disbelieve.": a note for the spell's
// time on each affected row with the GM's Disbelieve control (a Will save; the critical failure's with the penalty); the caster's choice and the
// heightened options a card reminder.
import { htmlToPlainText } from "./description-parser.js";

const WHAT = /^The target consistently detects one thing as another, can't detect something that's there, or detects something that's not there, though it doesn't alter their beliefs\. You choose which of these effects applies, and you determine the specifics of the hallucination\./;
const SAVES = /^The target can attempt an initial (Will) save, with effects below\. They also receive a Will save to disbelieve the hallucination every time they (?:@UUID\[[^\]]+\]\{Seek\}|Seek) or directly interact with the hallucination\. .*The target can attempt to disbelieve with a large circumstance bonus in situations determined by the GM, [^.]+\.$/;
const UNTIL = "The creature perceives what you chose until it disbelieves";
const PENALTY = /^, and it trusts its false senses, taking a [-–−](\d+) (circumstance|status) penalty to saves to disbelieve\.$/;
const HEIGHTENED = [/^Heightened \(6th\) Choose to either target up to 10 creatures or change the spell's duration to until your next daily preparations\.$/,
    /^Heightened \(8th\) Choose to either target any number of creatures or change the spell's duration to unlimited\.$/];

/** {html, notes, reminder, sentences} or null. */
export function rewriteHallucination(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const hours = /^(\d+) hours?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !hours) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const lifts = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const saves = SAVES.exec(paragraphs[1] ?? "");
    const penalty = plain("Critical Failure").startsWith(UNTIL) ? PENALTY.exec(plain("Critical Failure").slice(UNTIL.length)) : null;
    if (paragraphs.length !== 2 || !WHAT.test(paragraphs[0]) || !saves || saves[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4
        || !/^The creature is unaffected\.$/.test(plain("Critical Success")) || plain("Success") !== `${UNTIL}, but it knows what the hallucination is.` || plain("Failure") !== `${UNTIL}.` || !penalty
        || lifts.length !== 2 || !lifts.every((lift, index) => HEIGHTENED[index].test(lift))) return null;
    const base = "The creature perceives the hallucination the caster chose (one thing detected as another, something there it can't detect, or something not there it detects) — its beliefs are unchanged. Each time it Seeks or directly interacts with the hallucination, the GM uses the Disbelieve control (a Will save; the GM may grant a large circumstance bonus when the hallucination is plainly impossible, such as climbing a nonexistent tower).";
    const length = { mode: "fixed", value: Number(hours[1]), unit: "hours", expiry: null, anchor: "effect-start", offset: 0, sourceText: String(adapted.lifecycle.duration).trim() };
    const note = (row, text, disbelieve) => ({ label: "Hallucination", text, sourceText: plain(row), claimsRow: true, gmPlays: true, disbelieve, duration: { ...length } });
    return {
        html: `<p>The target must attempt a ${saves[1]} save.</p><hr />` + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: {
            success: note("Success", `${base} It knows what the hallucination is.`, { statistic: "will", endsSpell: true, needs: "success" }),
            failure: note("Failure", base, { statistic: "will", endsSpell: true, needs: "success" }),
            criticalFailure: note("Critical Failure", `${base} It trusts its false senses: a –${penalty[1]} ${penalty[2]} penalty to its saves to disbelieve.`,
                { statistic: "will", endsSpell: true, needs: "success", penalty: { value: -Number(penalty[1]), type: penalty[2] } })
        },
        reminder: { kind: "spell-note", text: "The caster chooses the hallucination and its specifics. At 6th rank or higher the caster chooses more targets (up to 10; any number at 8th) or the longer duration (until the next daily preparations; unlimited at 8th) — with the longer duration, the GM extends the Hallucination notes.",
            sourceText: lifts.join(" ") },
        sentences: [paragraphs[0], paragraphs[1], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`), lifts.join(" ")]
    };
}
