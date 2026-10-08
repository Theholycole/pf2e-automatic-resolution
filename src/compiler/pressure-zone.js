// A zone of plunging air pressure (Pressure Zone): "… Each living creature in the area of the spell when you cast it or that enters the area during the spell's
// duration must attempt a Fortitude save." with rows "… {Deafened} and {Clumsy 1} until the end of its next turn, after which it's temporarily immune for 1
// hour." / "The creature is deafened and {Clumsy 2}. At the end of each of its turns, it can attempt a new save if it's no longer in the pressure zone. On a
// success, it ends the effects and is temporarily immune for 1 hour." / "… deafened and clumsy 2 for the duration of the spell." and after the table "A
// creature Deafened by this spell can attempt to end the condition by popping its ears. It can use a single action to attempt a new Fortitude save, losing the
// deafened condition from this spell on a success. Some creatures with anatomies that lack inner ears or joints might be immune to these effects, as
// determined by the GM.": the placed burst's saves for living creatures (on casting or entering); the rows' conditions (the failure's until its end-of-turn
// save — only once it's outside the zone — succeeds; the critical failure's for the spell); immune for an hour after any result (a creature that keeps the
// effects isn't asked again); the deafened condition's own 1-action save (popping its ears) on each row's Effect; anatomy immunity a GM reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_HYPHEN_NAME as C } from "./text-patterns.js";

const WHO = /^Each living creature in the area of the spell when you cast it or that enters the area during the spell's duration must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^The creature is ${C} and ${C} until the end of its next turn, after which it's temporarily immune for (\d+) (hour|minute)s?\.$`);
const FAILURE = new RegExp(String.raw`^The creature is ([a-z]+) and ${C}\. At the end of each of its turns, it can attempt a new save if it's no longer in the [a-z ]+\. On a success, it ends the effects and is temporarily immune for (\d+) (hour|minute)s?\.$`);
const CRITICAL = /^The creature is ([a-z]+) and ([a-z]+) (\d) for the duration of the spell\.$/;
const POP = /^A creature (?:@UUID\[[^\]]+\]\{)?([A-Za-z]+)\}? by this spell can attempt to end the condition by [a-z ]+\. It can use a single action to attempt a new (Fortitude|Reflex|Will) save, losing the ([a-z]+) condition from this spell on a success\.$/;
const ANATOMY = /^Some creatures with anatomies that lack [a-z ]+ might be immune to these effects, as determined by the GM\.$/;

/** {html, immunity, popSave, recurring, reminder, sentences} or null. */
export function rewritePressureZone(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const who = WHO.exec(lead.at(-1) ?? "");
    if (!who || lead.length !== 2 || /\d|@|\b(?:damage|bonus|penalty|condition|immune)\b/i.test(lead[0]) || who[1].toLowerCase() !== adapted.defense.statistic) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const after = paragraphs.filter(p => !/^<strong>/.test(p));
    if (paragraphs.length !== 5 || after.length !== 1) return null;
    const afterSentences = htmlToPlainText(after[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const popText = afterSentences.slice(0, 2).join(" "), pop = POP.exec(after[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").split(/(?<=\.)\s+(?=Some )/)[0].trim()) ?? POP.exec(popText);
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(htmlToPlainText(row("Critical Failure")).trim());
    if (htmlToPlainText(row("Critical Success")).trim() !== "The creature is unaffected." || !success || !failure || !critical || !pop || afterSentences.length !== 3 || !ANATOMY.test(afterSentences[2])) return null;
    const deafened = success[2].toLowerCase(), clumsy = success[5].toLowerCase();
    if (failure[1] !== deafened || failure[3].toLowerCase() !== clumsy || critical[1] !== deafened || critical[2] !== clumsy || pop[1].toLowerCase() !== deafened || pop[3] !== deafened
        || pop[2] !== who[1] || success[3] || success[7] !== failure[5] || success[8] !== failure[6] || critical[3] !== failure[4]) return null;
    const link = (uuid, name, value) => `@UUID[${uuid}]{${name}${value ? ` ${value}` : ""}}`;
    const deaf = link(success[1], success[2]);
    const hour = { value: Number(success[7]), unit: `${success[8]}s` };
    return {
        html: `<p>Each living creature in the area must attempt a ${who[1]} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature is ${deaf} and ${link(success[4], success[5], success[6])} until the end of its next turn.</p>`
            + `<p><strong>Failure</strong> The creature is ${deaf} and ${link(failure[2], failure[3], failure[4])}.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${deaf} and ${link(failure[2], failure[3], critical[3])} for the duration of the spell.</p>`,
        // (Any result: immune for the hour — a creature that keeps the effects isn't asked again.)
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: hour, sourceText: htmlToPlainText(row("Success")).trim() },
        recurring: { timing: "turn-end", mode: "end", statistic: who[1].toLowerCase(), outsideArea: true, sourceText: htmlToPlainText(row("Failure")).trim() },
        popSave: { slug: deafened, statistic: pop[2].toLowerCase(), sourceText: popText },
        reminder: { kind: "spell-note", text: `${afterSentences[2]} Leave them out on review.`, sourceText: afterSentences[2] },
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => htmlToPlainText(row(heading)).trim()), ...afterSentences, popText]
    };
}
