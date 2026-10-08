// Sadness that floods an aura (Overflowing Sorrow): "Sadness flows out of you into nearby creatures, blotting out any other thoughts they had. The first time a
// creature begins its turn in the area or enters the area, it must attempt a Will save. If it later leaves and reenters the area, it uses the same effect as
// before." with rows "The creature is unaffected." / "The creature takes a –1 status penalty to skill checks and Perception checks as long as it remains in the
// area." / "While the creature is in the area, any emotion effects of lower counteract rank than overflowing sorrow are suppressed, and whenever the creature
// attempts to use an emotion action or cast an emotion spell, it must succeed at a @Check[flat|dc:11|showDC:all] or the action or spell is disrupted." / "As
// failure, but the creature can't use emotion actions or spells." and "Heightened (+2) When you Cast the Spell, you can choose to increase the area by 5 feet.":
// the caster's sustained emanation (the caster out of it); each creature saves once (immune for the spell after any result); the success's penalty PF2e's
// modifier and the failing rows' rules notes, each lasting while the creature is in the area; re-entry and the optional larger area reminders.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const FIRST = /^The first time a creature begins its turn in the area or enters the area, it must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SAME = /^If it later leaves and reenters the area, it uses the same effect as before\.$/;
const SUCCESS = /^The creature takes a –(\d) (status|circumstance) penalty to skill checks and Perception checks as long as it remains in the area\.$/;
const FAILURE = /^While the creature is in the area, (any emotion effects of lower counteract rank than [a-z ]+ are suppressed), and (whenever the creature attempts to use an emotion action or cast an emotion spell, it must succeed at a DC (\d+) flat check or the action or spell is disrupted)\.$/;
const CRITICAL = /^As failure, but (the creature can't use emotion actions or spells)\.$/;
const STEP = /^Heightened \(\+(\d)\) When you Cast the Spell, you can choose to increase the area by (\d+) feet\.$/;

/** {html, immunity, notes, areaStep, reminders, sentences} or null. */
export function rewriteSorrowAura(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area?.type !== "emanation" || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const first = FIRST.exec(sentences[1] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "")
        .replace(/@Check\[flat\|dc:(\d+)[^\]]*\]/g, "DC $1 flat check").replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(plain("Critical Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 3 || NARRATION_RULES.test(sentences[0]) || !first || !SAME.test(sentences[2]) || rows.length !== 4 || plain("Critical Success") !== "The creature is unaffected."
        || !success || !failure || !critical || !step || first[1].toLowerCase() !== adapted.defense.statistic) return null;
    const spell = { value: Number(minutes[1]), unit: "minutes" };
    const inArea = { mode: "unlimited", sourceText: "while in the area" };
    const failText = `${failure[1][0].toUpperCase()}${failure[1].slice(1)}; ${failure[2]}.`;
    return {
        html: `<p>${sentences[0]} A creature that enters or starts its turn in the area must attempt a ${first[1]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature is unaffected.</p><p><strong>Critical Failure</strong> The creature is unaffected.</p>`,
        immunity: { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { ...spell }, sourceText: sentences[2] },
        notes: {
            success: { label: "Overflowing sorrow", text: `A –${success[1]} ${success[2]} penalty to skill checks and Perception checks while it's in the area.`, sourceText: plain("Success"), claimsRow: true,
                duration: inArea, whileInArea: true, rules: [{ key: "FlatModifier", selector: ["skill-check", "perception"], type: success[2], value: -Number(success[1]) }] },
            failure: { label: "Overflowing sorrow", text: `${failText} (While it's in the area.)`, sourceText: plain("Failure"), claimsRow: true, duration: inArea, whileInArea: true, gmPlays: true },
            criticalFailure: { label: "Overflowing sorrow", text: `${failText} ${critical[1][0].toUpperCase()}${critical[1].slice(1)}. (While it's in the area.)`, sourceText: plain("Critical Failure"), claimsRow: true, duration: inArea, whileInArea: true, gmPlays: true }
        },
        areaStep: { interval: Number(step[1]), feet: Number(step[2]), baseRank: Number(adapted.rank) || 1, sourceText: htmlToPlainText(heightened).trim() },
        reminders: [
            { kind: "spell-note", text: `${sentences[2]} The module doesn't ask it again; re-apply its note while it's back in the area.`, sourceText: sentences[2] },
            { kind: "spell-note", text: `${htmlToPlainText(heightened).trim().replace(/^Heightened \(\+\d\) /, "")} The module uses the larger area (shrink the emanation if you choose not to).`, sourceText: htmlToPlainText(heightened).trim() }
        ],
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => plain(h)), htmlToPlainText(heightened).trim()]
    };
}
