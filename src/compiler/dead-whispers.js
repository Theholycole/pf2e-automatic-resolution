// Whispers that hold and suggest (Whispers of a Dead Goddess): "The mysterious whispers … become audible. A creature in the area when this Spell is Cast
// or who enters the area must attempt a Will save." with rows "The creature is unaffected and becomes temporarily immune for 1 hour." / "The target
// becomes Stunned 1, listening to the whispers." / "As success, and the creature will not voluntarily leave the area for 1 round." / "As failure, and
// you can whisper a single course of action to each creature that critically failed, with the effects of suggestion. The effect ends on a creature if
// you stop sustaining the spell or the creature leaves the area.": the lingering burst's saves (in it at the cast, or entering it); Stunned 1; the
// critical success's immunity; staying in the area a note for its round; the suggestion a note for the sustained time; hearing the GM's review.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^The mysterious whispers [^.]+, become audible\. A creature in the area when this Spell is Cast or who enters the area must attempt a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^The target becomes (${C}Stunned (\d)\}), listening to the whispers\.$`);
const FAILURE = /^As success, and the creature will not voluntarily leave the area for (\d+) rounds?\.$/;
const CRITICAL = /^As failure, and you can whisper a single course of action to each creature that critically failed, with the effects of (?:@UUID\[[^\]]+\]\{suggestion\}|suggestion)\. (The effect ends on a creature if you stop sustaining the spell or the creature leaves the area\.)$/;

/** {html, notes, reminder, sentences} or null. */
export function rewriteDeadWhispers(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^sustained up to (\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const immune = /^The creature is unaffected and becomes temporarily immune for (\d+) (hour|minute)s?\.$/.exec(plain("Critical Success"));
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !immune || !success || !failure || !critical) return null;
    const stays = { label: "Held by the whispers", text: "It won't voluntarily leave the area.", sourceText: plain("Failure"), claimsRow: true, gmPlays: true,
        duration: { mode: "fixed", value: Number(failure[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${failure[1]} round${failure[1] === "1" ? "" : "s"}` } };
    return {
        html: `<p>A creature in the area when you Cast the Spell, or that enters the area, must attempt a ${lead[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected and temporarily immune for ${immune[1]} ${immune[2]}${immune[1] === "1" ? "" : "s"}.</p>`
            + ["Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The creature is ${success[1]}.</p>`).join(""),
        notes: { failure: stays, criticalFailure: [{ ...stays, sourceText: plain("Critical Failure") }, { label: "Whispered suggestion", text: `The caster can whisper it a single course of action, with the effects of suggestion (the GM plays it). ${critical[1].replace(/^The effect ends on a creature if you stop/, "It ends if the caster stops").replace(/the creature leaves/, "it leaves")}`,
            sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true,
            duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `sustained up to ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` } }] },
        reminder: { kind: "spell-note", text: "The whispers are auditory: leave out (in the area review) creatures that can't hear them.", sourceText: lead[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
