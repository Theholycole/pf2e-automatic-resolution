// A memory rewritten as it forms (Shift Blame): "Trigger You or another creature attacks a creature or fails at a Deception, Diplomacy, or Intimidation
// check." / "You alter the target's memories of the triggering event as they form. You choose another creature … and you alter the target's memories to
// recall the creature you chose as responsible for the triggering attack or skill check. The target must attempt a Will save and is then temporarily
// immune for 24 hours." with rows "The target knows you attempted to alter its memories." / "The target doesn't realize you attempted to alter its
// memories, though it knows you cast a spell." / "You successfully alter the target's memory. It isn't forced to react … question them if they
// contradict …": the target is the trigger's (the caster picks it); every result immune for 24 hours; the failure's altered memory a note (the GM's);
// what the target notices a reminder.
import { htmlToPlainText } from "./description-parser.js";

const BODY = /^You alter the target's memories of the triggering event as they form\. You choose another creature \(which can be you\) with the capacity to make the triggering attack or skill check, and you alter the target's memories to recall the creature you chose as responsible for the triggering attack or skill check\. The target must attempt a (Fortitude|Reflex|Will) save and is then temporarily immune for (\d+) (hour|minute)s?\.$/;
const FAILURE = /^You successfully alter the target's memory\. (It isn't forced to react to the new memories in a particular way, and it's likely to question them if they contradict other information it knows or are implausible for the situation\.)$/;

/** {html, note, immunity, reminder, constraint, sentences} or null. */
export function rewriteBlameShift(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^the target of the triggering attack or skill check$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = BODY.exec(paragraphs[1] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(plain("Failure"));
    if (paragraphs.length !== 2 || !/^Trigger You or another creature attacks a creature or fails at a Deception, Diplomacy, or Intimidation check\.$/.test(paragraphs[0]) || !lead
        || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 3 || plain("Critical Success") !== "The target knows you attempted to alter its memories."
        || plain("Success") !== "The target doesn't realize you attempted to alter its memories, though it knows you cast a spell." || !failure) return null;
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        note: { label: "Shifted blame", text: `It remembers the creature the caster chose as responsible for the triggering attack or check. ${failure[1].replace(/^It isn't/, "It isn't")}`, sourceText: plain("Failure"), claimsRow: true, gmPlays: true,
            duration: { mode: "unlimited", sourceText: "unlimited" } },
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { value: Number(lead[2]), unit: `${lead[3]}s` }, sourceText: lead[0] },
        reminder: { kind: "spell-note", text: "Target the creature the triggering attack or failed Deception, Diplomacy or Intimidation check was against, and name the creature to blame. On a critical success it knows the caster tried to alter its memories; on a success it only knows a spell was cast.",
            sourceText: lead[0] },
        constraint: { sourceText: "the target of the triggering attack or skill check", supportsActorTargets: true, complete: true, predicates: [] },
        sentences: [...paragraphs, ...["Critical Success", "Success", "Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
