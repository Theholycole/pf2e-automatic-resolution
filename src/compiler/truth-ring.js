// An area where lies ring false (Ring of Truth): "You designate an area in which lies are revealed. Creatures in the area also take a –2 status penalty to
// Deception checks. Each time a creature in the area speaks a true statement, the soft ring of a bell sounds in the area. Creatures are aware of the magic; …
// If a creature is in the area when the spell is cast or later enters the area, that creature attempts a Will save. It uses the results of this initial
// save if it leaves and reenters the area." with rows about the bell (no critical failure row: it's the failure's): the placed burst's saves, once per
// creature (immune for the spell); each result a note while the creature is in the area — the bell's behaviour for it (the GM's) and the area's penalty to
// Deception (PF2e's modifier); re-entry a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_SHORT as NARRATION_RULES } from "./text-patterns.js";

const LEAD = /^You designate an area in which [a-z ]+\.$/;
const PENALTY = /^Creatures in the area also take a [–-](\d) (status|circumstance) penalty to ([A-Z][a-z]+) checks\.$/;
const WHO = /^If a creature is in the area when the spell is cast or later enters the area, that creature attempts an? (Fortitude|Reflex|Will) save\.$/;
const SAME = /^It uses the results of this initial save if it leaves and reenters the area\.$/;
const SKILLS = new Set(["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society", "Stealth", "Survival", "Thievery"]);

/** {html, immunity, notes, reminder, sentences} or null. */
export function rewriteTruthRing(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "burst" || adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const time = /^(\d+) (minute|hour)s?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!time || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const whoAt = sentences.findIndex(sentence => WHO.test(sentence));
    const penalty = PENALTY.exec(sentences[1] ?? "");
    if (!LEAD.test(sentences[0] ?? "") || !penalty || !SKILLS.has(penalty[3]) || whoAt < 3 || whoAt !== sentences.length - 2 || !SAME.test(sentences.at(-1))) return null;
    // (Between them, only how the area behaves: no number, link or other rule.)
    const behaviour = sentences.slice(2, whoAt);
    if (behaviour.some(sentence => NARRATION_RULES.test(sentence.replace(/\b(?:can|they|their)\b/g, "")))) return null;
    const statistic = WHO.exec(sentences[whoAt])[1];
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const texts = { criticalSuccess: plain("Critical Success"), success: plain("Success"), failure: plain("Failure") };
    if (rows.length !== 3 || Object.values(texts).some(text => !text || /\d|@|\b(?:damage|bonus|penalty|condition|immune)\b/i.test(text))) return null;
    texts.criticalFailure = texts.failure;
    const span = { value: Number(time[1]), unit: `${time[2]}s` };
    const value = -Number(penalty[1]), skill = penalty[3].toLowerCase();
    const note = degree => ({ label: "Ring of truth", text: `${texts[degree]} ${penalty[0].replace(/^Creatures in the area also take/, "It takes")} (While it's in the area.)`,
        sourceText: texts[degree], claimsRow: true, duration: { mode: "unlimited", sourceText: "while in the area" }, whileInArea: true, gmPlays: true,
        rules: [{ key: "FlatModifier", selector: skill, type: penalty[2], value }] });
    return {
        html: `<p>${sentences[0]} A creature in the area when you Cast the Spell or that enters the area must attempt a ${statistic} save.</p><hr />`
            + ["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The creature is unaffected.</p>`).join(""),
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: span, sourceText: sentences.at(-1) },
        notes: { criticalSuccess: note("criticalSuccess"), success: note("success"), failure: note("failure"), criticalFailure: note("criticalFailure") },
        reminder: { kind: "spell-note", text: `${sentences.at(-1)} ${behaviour.join(" ")} The module doesn't ask it again; re-apply its note when it's back in the area.`, sourceText: sentences.at(-1) },
        sentences: [...sentences, texts.criticalSuccess, texts.success, texts.failure]
    };
}
