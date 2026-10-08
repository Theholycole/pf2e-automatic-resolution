// Time stopped around the target (Stasis): "The flow of time congeals around an object or creature, holding it in place. The target must attempt a
// Will save (an unattended object automatically critically fails its save)." with rows "The target is @UUID[…]{Stunned 1} as time thickens around
// it." / "Time ceases to pass for the target for 1 round. It is invulnerable to all damage, it can't be targeted or affected by anything, and no
// rounds elapse for any timed durations, conditions, afflictions, and other effects it has. While in stasis, the target can't be moved, and it
// remains fixed in place, defying gravity if need be." / "As failure, but the target is held in stasis for 3 rounds. At the end of each of its turns,
// it can attempt a Will save to reduce the remaining duration by 1 round or end it entirely on a critical success.": Stunned 1; the stasis a GM
// note for its rounds (the critical failure's with PF2e's end-of-turn save shortening it); the unattended object's automatic critical failure a
// reminder. (The module can't stop PF2e's own timers: the note says so.)
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const LEAD = /^The flow of time congeals around an object or creature, holding it in place\. The target must attempt a (Fortitude|Reflex|Will) save \((an unattended object automatically critically fails its save)\)\.$/;
const SUCCESS = new RegExp(String.raw`^The target is (${C}Stunned (\d)\}) as time thickens around it\.$`);
const FAILURE = /^Time ceases to pass for the target for (\d+) rounds?\. (It is invulnerable to all damage, it can't be targeted or affected by anything, and no rounds elapse for any timed durations, conditions, afflictions, and other effects it has\.) (While in stasis, the target can't be moved, and it remains fixed in place, defying gravity if need be\.)$/;
const CRITICAL = /^As failure, but the target is held in stasis for (\d+) rounds\. At the end of each of its turns, it can attempt a (Fortitude|Reflex|Will) save to reduce the remaining duration by 1 round or end it entirely on a critical success\.$/;

/** {html, notes, reminder, sentences} or null. */
export function rewriteStasisRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^1 creature or up to 1 Bulk of objects$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(plain("Critical Success"))
        || !success || !failure || !critical || critical[2] !== lead[1]) return null;
    const text = `Time has stopped for the creature. ${failure[2]} ${failure[3]} GM: the module can't pause PF2e's timers — hold its other effects' durations while this lasts.`;
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${success[1]}.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        notes: {
            failure: { label: "Stasis", text, sourceText: plain("Failure"), claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: Number(failure[1]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${failure[1]} round${failure[1] === "1" ? "" : "s"}` } },
            criticalFailure: { label: "Stasis", text: `${text} At the end of each of its turns it can attempt a ${critical[2]} save to shorten this by 1 round (ending it on a critical success).`,
                sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true,
                duration: { mode: "fixed", value: Number(critical[1]), unit: "rounds", expiry: "turn-end", anchor: "effect-start", offset: 0, sourceText: `${critical[1]} rounds` },
                recurringSave: { timing: "turn-end", mode: "reduce", statistic: critical[2].toLowerCase(), sourceText: plain("Critical Failure") } }
        },
        reminder: { kind: "spell-note", text: "An unattended object automatically critically fails its save: set its result to critical failure (up to 1 Bulk of objects may be targeted instead of a creature).", sourceText: lead[0] },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
