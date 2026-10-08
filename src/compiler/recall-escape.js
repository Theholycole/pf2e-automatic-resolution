// Knowledge the target can only escape by understanding it (Unsettling Knowledge): "When you Cast this Spell, choose Arcana, Nature, Occultism, Religion,
// or Society as the focus of this knowledge. The target must attempt a Will save." with rows "The target is @UUID[…]{Fascinated} by the knowledge you
// shared for 1 round." / "The target is fascinated by the knowledge for 1 minute. The target can end this fascination early by attempting a skill check
// to Recall Knowledge to understand the knowledge using the chosen skill (using your spell DC as the DC); regardless of the result, the target becomes
// @UUID[…]{Frightened 2}, but if they failed the check, they can't reduce their frightened condition below 1 for the remainder of the spell's
// duration." / "As failure, but the target becomes @UUID[…]{Frightened 3} if they attempt to Recall Knowledge.": Fascinated for the row's time; on the
// failing rows the creature's Recall Knowledge control (the chosen skill against the spell DC) ends it, frightens it, and on a failed check keeps
// its frightened at least 1 until the spell's minute is over.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, MUST_ATTEMPT_SAVE as SAVE } from "./text-patterns.js";

const CHOOSE = /^When you Cast this Spell, choose ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+) as the focus of this knowledge\.$/;
const SUCCESS = new RegExp(String.raw`^The target is (${C}Fascinated\}) by the knowledge you shared for 1 round\.$`);
const FAILURE = new RegExp(String.raw`^The target is fascinated by the knowledge for (\d+) minutes?\. The target can end this fascination early by attempting a skill check to Recall Knowledge to understand the knowledge using the chosen skill \(using your spell DC as the DC\); regardless of the result, the target becomes ${C}Frightened (\d)\}, but if they failed the check, they can't reduce their frightened condition below (\d) for the remainder of the spell's duration\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the target becomes ${C}Frightened (\d)\} if they attempt to Recall Knowledge\.$`);

/** {html, notes, sentences} or null. */
export function rewriteRecallEscape(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const choose = CHOOSE.exec(lead[1] ?? ""), save = SAVE.exec(lead[2] ?? "");
    if (lead.length !== 3 || /\d|@/.test(lead[0]) || !choose || !save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (rows.length !== 4 || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !critical) return null;
    const skills = choose[1].replace(/,? or /, ", ").split(/, /).map(skill => skill.toLowerCase());
    const minutes = Number(failure[1]);
    const length = { mode: "fixed", value: minutes, unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `for ${minutes} minute${minutes === 1 ? "" : "s"}` };
    const note = (degree, frightened) => ({ label: "Unsettling knowledge", text: `The creature can end its fascination early with a Recall Knowledge check (the caster's chosen skill: ${choose[1]}) against the spell DC: it then becomes Frightened ${frightened}, and on a failed check its frightened can't go below ${failure[3]} for the rest of the spell's duration.`,
        sourceText: htmlToPlainText(row(degree === "failure" ? "Failure" : "Critical Failure")), claimsRow: true, gmPlays: true, duration: { ...length },
        recallEscape: { skills, frightened: Number(frightened), floor: Number(failure[3]) } });
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${success[1]} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target is ${success[1]} for ${minutes} minute${minutes === 1 ? "" : "s"}.</p><p><strong>Critical Failure</strong> The target is ${success[1]} for ${minutes} minute${minutes === 1 ? "" : "s"}.</p>`,
        notes: { failure: note("failure", failure[2]), criticalFailure: note("criticalFailure", critical[1]) },
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
