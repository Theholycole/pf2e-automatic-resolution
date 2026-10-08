// Eddies of time around the caster (Morass of Ages): "You surround yourself in temporal eddies that draw out time for those around you, making every step feel like
// an eternity endured. A creature in the emanation, or that later enters the emanation, must attempt a Fortitude save. The creature attempts this save only once and
// uses the same effect for the duration of the spell. Each time you Sustain the Spell, you can choose to increase the emanation's radius by 5 feet, to a maximum of
// 60 feet." with rows "The creature is unaffected." / "Squares in the area are difficult terrain for the creature." / "Squares in the area are difficult terrain for
// the creature, and the creature is @UUID[…]{Slowed 1} when it starts its turn in the area." / "As failure, plus the creature also becomes @UUID[…]{Restrained}.
// The creature can attempt to Escape against your spell DC to remove the restrained condition.": the caster's sustained emanation (the caster out of it) whose
// creatures save once (immune for the spell); the difficult terrain a note while inside; a failure's Slowed 1 granted while it's inside (being slowed as its turn
// starts there); a critical failure's Restrained until it Escapes; the optional growth a control (5 feet, up to 60) after each Sustain; re-entry a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C, NARRATION_RULES } from "./text-patterns.js";

const WHO = /^A creature in the emanation, or that later enters the emanation, must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ONCE = /^The creature attempts this save only once and uses the same effect for the duration of the spell\.$/;
const GROW = /^Each time you Sustain the Spell, you can choose to increase the emanation's radius by (\d+) feet, to a maximum of (\d+) feet\.$/;
const TERRAIN = /^Squares in the area are difficult terrain for the creature\.$/;
const FAILURE = new RegExp(String.raw`^Squares in the area are difficult terrain for the creature, and the creature is ${C}(Slowed) (\d)\} when it starts its turn in the area\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, plus the creature also becomes (${C}Restrained\})\. The creature can attempt to Escape against your spell DC to remove the restrained condition\.$`);

/** {html, immunity, notes, growth, reminder, sentences} or null. */
export function rewriteTimeMorass(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const who = WHO.exec(sentences[1] ?? ""), grow = GROW.exec(sentences[3] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !who || !ONCE.test(sentences[2]) || !grow || rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The creature is unaffected."
        || !TERRAIN.test(htmlToPlainText(row("Success")).trim()) || !failure || !critical || who[1].toLowerCase() !== adapted.defense.statistic) return null;
    const spell = { value: Number(minutes[1]), unit: "minutes" };
    const inArea = { mode: "unlimited", sourceText: "while in the area" };
    const terrain = { label: "Morass of ages", text: "The area's squares are difficult terrain for it (while it's inside).", claimsRow: true, duration: inArea, whileInArea: true, gmPlays: true };
    const slowed = { key: "GrantItem", uuid: failure[1], flag: "conditionSlowed", allowDuplicate: true, onDeleteActions: { grantee: "cascade" }, alterations: [{ mode: "override", property: "badge-value", value: Number(failure[3]) }] };
    const heavy = { ...terrain, text: `The area's squares are difficult terrain for it, and it's ${failure[2]} ${failure[3]} as its turn starts in the area (the module grants it while it's inside).`, rules: [slowed] };
    return {
        html: `<p>${sentences[0]} A creature in the area when you Cast the Spell or that enters the area must attempt a ${who[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${critical[1]} until it Escapes.</p>`,
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { ...spell }, sourceText: sentences[2] },
        notes: { success: { ...terrain, sourceText: htmlToPlainText(row("Success")).trim() }, failure: { ...heavy, sourceText: htmlToPlainText(row("Failure")).trim() },
            criticalFailure: { ...heavy, sourceText: htmlToPlainText(row("Critical Failure")).trim() } },
        growth: { feet: Number(grow[1]), optional: true, maximum: Number(grow[2]), sourceText: sentences[3] },
        reminder: { kind: "spell-note", text: `${sentences[2]} The module doesn't ask it again; re-apply its note when it's back in the area.`, sourceText: sentences[2] },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => htmlToPlainText(row(h)).trim())]
    };
}
