// An entrancing aura (Captivating Adoration): "You become intensely entrancing, and creatures are distracted by you as long as they remain within the
// area." / "You can exclude any creatures you choose from the effects." / "If a creature is in the aura when you Cast the Spell or when a creature enters
// the area for the first time, it must attempt a Will saving throw." / "If a creature leaves and reenters, it uses the results of its original save."
// with rows "The creature is unaffected and temporarily immune for 1 hour." / "The creature is @UUID[…]{Fascinated} with you for its next action,
// then is temporarily immune for 1 hour." / "The creature is Fascinated with you." / "The creature is Fascinated with you, and its attitude toward
// you improves by one step." and "Heightened (+1) Increase the size of the emanation by 15 feet.": the caster's emanation (the caster out of it)
// whose creatures save when it starts and on entering; a failure's Fascinated lasts while the creature stays in the area; the success's until the
// end of its next turn (the reminder: only its next action); each creature is exposed once (an immunity: an hour after a success, the spell's
// minute otherwise); the exclusions, the re-entry and the attitude reminders.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, DEGREE_LABEL_PAIRS as DEGREES } from "./text-patterns.js";

const LEAD = /^You become intensely entrancing, and creatures are distracted by you as long as they remain within the area\.$/;
const EXCLUDE = /^You can exclude any creatures you choose from the effects\.$/;
const WHEN = /^If a creature is in the aura when you Cast the Spell or when a creature enters the area for the first time, it must attempt an? (Fortitude|Reflex|Will) saving throw\.$/;
const AGAIN = /^If a creature leaves and reenters, it uses the results of its original save\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected and temporarily immune for (\d+) (hour|minute)s?\.$/,
    success: new RegExp(String.raw`^The creature is (${C}([A-Z][a-z]+)\}) with you for its next action, then is temporarily immune for (\d+) (hour|minute)s?\.$`),
    failure: /^The creature is ([A-Z][a-z]+) with you\.$/,
    criticalFailure: /^The creature is ([A-Z][a-z]+) with you, and (its attitude toward you improves by one step)\.$/
};
const STEP = /^Heightened \(\+(\d)\) Increase the size of the emanation by (\d+) feet\.$/;

/** {html, immunity, areaStep, reminders, sentences} or null. */
export function rewriteAdorationRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const when = WHEN.exec(sentences[2] ?? "");
    if (sentences.length !== 4 || !LEAD.test(sentences[0]) || !EXCLUDE.test(sentences[1]) || !when || !AGAIN.test(sentences[3]) || when[1].toLowerCase() !== adapted.defense.statistic) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const found = Object.fromEntries(DEGREES.map(([degree, heading]) => [degree, ROWS[degree].exec(degree === "success" ? row(heading) : htmlToPlainText(row(heading)).trim())]));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4 || DEGREES.some(([degree]) => !found[degree]) || !step) return null;
    const condition = found.success[1], name = found.success[2];
    if (found.failure[1] !== name || found.criticalFailure[1] !== name) return null;
    const unit = word => word === "hour" ? "hours" : "minutes";
    const spell = { value: Number(minutes[1]), unit: "minutes" };
    return {
        html: `<p>You become intensely entrancing. A creature in the area when you Cast the Spell or that enters the area must attempt a ${when[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is ${condition} until the end of its next turn.</p>`
            + `<p><strong>Failure</strong> The creature is ${condition} as long as it remains in the area.</p><p><strong>Critical Failure</strong> The creature is ${condition} as long as it remains in the area.</p>`,
        // Each creature saves once ("If a creature leaves and reenters, it uses the results of its original save."): the rows' hour after a success,
        // the spell's minute after a failure.
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { value: Number(found.criticalSuccess[1]), unit: unit(found.criticalSuccess[2]) },
            byDegree: { criticalSuccess: { value: Number(found.criticalSuccess[1]), unit: unit(found.criticalSuccess[2]) }, success: { value: Number(found.success[3]), unit: unit(found.success[4]) },
                failure: { ...spell }, criticalFailure: { ...spell } }, sourceText: [sentences[3], `Critical Success ${htmlToPlainText(row("Critical Success")).trim()}`].join(" ") },
        areaStep: { interval: Number(step[1]), feet: Number(step[2]), baseRank: Number(adapted.rank) || 1, sourceText: htmlToPlainText(heightened).trim() },
        reminders: [
            { kind: "spell-note", text: `${sentences[1]} Leave them out in the area review.`, sourceText: sentences[1] },
            { kind: "spell-note", text: `${sentences[3]} The module doesn't ask it again; a creature whose original result was a failure is ${name} with you again while it's in the area (apply it).`, sourceText: sentences[3] },
            { kind: "spell-note", text: `A success leaves the creature ${name} with you only for its next action (remove it then).`, sourceText: `Success ${htmlToPlainText(row("Success")).trim()}` },
            { kind: "spell-note", text: `On a critical failure, ${found.criticalFailure[2]} (the GM's).`, sourceText: `Critical Failure ${htmlToPlainText(row("Critical Failure")).trim()}` }
        ],
        sentences: [...sentences, ...DEGREES.map(([, heading]) => `${heading} ${htmlToPlainText(row(heading)).trim()}`), htmlToPlainText(heightened).trim()]
    };
}
