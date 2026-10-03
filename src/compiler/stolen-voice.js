// A voice taken from the target (Steal Voice): "You steal a creature's voice, rendering them mute. The effect is determined by the target's Fortitude
// save. The target then becomes temporarily immune for 1 minute. A creature that has no voice or can't speak is immune to this spell." with rows
// "The target becomes voiceless until the end of its next turn. A voiceless creature can't speak, create vocal sounds, or take auditory actions
// (including supplying verbal or command components). As long as the target is voiceless, whenever you speak, you can choose to have your voice sound
// like either your voice or the target's voice." / "As success, but the duration is 1 minute." / "As success, but the duration is permanent.": the
// save's immunity; each failing row a voiceless note for its time (PF2e has no such condition); creatures without a voice left out by the GM.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You steal a creature's voice, rendering them mute\. The effect is determined by the target's (Fortitude|Reflex|Will) save\. The target then becomes temporarily immune for (\d+) (minute|hour)s?\. (A creature that has no voice or can't speak is immune to this spell\.)$/;
const SUCCESS = /^The target becomes voiceless until the end of its next turn\. (A voiceless creature can't speak, create vocal sounds, or take auditory actions \(including supplying verbal or command components\)\.) (As long as the target is voiceless, whenever you speak, you can choose to have your voice sound like either your voice or the target's voice\.)$/;
const LATER = /^As success, but the duration is (?:(\d+) (round|minute|hour)s?|(permanent))\.$/;

/** {html, notes, immuneNote, sentences} or null. */
export function rewriteStolenVoice(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").trim();
    const success = SUCCESS.exec(row("Success")), failure = LATER.exec(row("Failure")), critical = LATER.exec(row("Critical Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The target is unaffected\.$/.test(row("Critical Success")) || !success || !failure || !critical) return null;
    const text = `The creature is voiceless: ${success[1].replace(/^A voiceless creature /, "it ")} ${success[2].replace(/^As long as the target is voiceless, whenever you speak, you can choose to have your voice sound like either your voice or/, "Meanwhile, whenever the caster speaks, the caster can choose to have their voice sound like either their own voice or")}`;
    const length = match => match[3] ? { mode: "unlimited", sourceText: "unlimited" }
        : { mode: "fixed", value: Number(match[1]), unit: `${match[2]}s`, expiry: match[2] === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `${match[1]} ${match[2]}${match[1] === "1" ? "" : "s"}` };
    const note = (degree, duration) => ({ label: "Voiceless", text, sourceText: row(degree), claimsRow: true, gmPlays: true, duration });
    return {
        html: `<p>The target must attempt a ${lead[1]} save. Afterward, the creature is temporarily immune for ${lead[2]} ${lead[3]}${lead[2] === "1" ? "" : "s"}.</p><hr />`
            + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: { success: note("Success", { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" }),
            failure: note("Failure", length(failure)), criticalFailure: note("Critical Failure", length(critical)) },
        immuneNote: { kind: "spell-note", text: "A creature that has no voice or can't speak is immune: leave it out.", sourceText: lead[4] },
        sentences: [lead[0], lead[4], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${row(heading)}`)]
    };
}
