// A lasso that holds and shocks on each Sustain (Lightning Lasso): "… The target must attempt a Reflex save." with rows "The target is unaffected" / "The
// target takes @Damage[2d12[electricity]] damage." / "The target takes @Damage[2d12[electricity]] damage and is @UUID[…]{Immobilized} until the end of
// your next turn, but it can Escape. On subsequent turns, if the target is still immobilized by the lasso, you can Sustain the spell to deal
// @Damage[(@item.rank -2)*2[electricity]] damage and keep the target immobilized until the end of your next turn." / "As failure, but the target is also
// @UUID[…]{Restrained}." and "Heightened (+1) The initial electricity damage increases by 1d12, and the electricity damage dealt when you Sustain the
// spell increases by 2.": the rows with PF2e's damage (heightened); the failing rows' conditions until the end of the caster's next turn or until it
// Escapes; each later round's first Sustain deals the flat damage to each target still held by this cast and renews its hold to the end of the caster's
// next turn.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const LEAD = /^(.+) The target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = /^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage\.$/;
const FAILURE = new RegExp(String.raw`^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and is (${C}(Immobilized)\}) until the end of your next turn, but it can Escape\. On subsequent turns, if the target is still immobilized by the [a-z]+, you can Sustain the spell to deal @Damage\[(\(@item\.rank -(\d)\)\*(\d))\[([a-z]+)\]\] damage and keep the target immobilized until the end of your next turn\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the target is also (${C}([A-Z][a-z]+)\})\.$`);
const STEP = /^Heightened \(\+1\) The initial ([a-z]+) damage increases by (\d+d\d+), and the \1 damage dealt when you Sustain the spell increases by (\d+)\.$/;

/** {html, hold, sentences} or null. */
export function rewriteSustainedLasso(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    if (!lead || NARRATION_RULES.test(lead[1]) || lead[2].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || !/^The target is unaffected\.?$/.test(htmlToPlainText(row("Critical Success")).trim()) || !success || !failure || !critical || !step) return null;
    const [, formula, type] = success;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || failure[1] !== formula || failure[2] !== type || failure[8] !== type || step[1] !== type || step[3] !== failure[7]
        // (The Sustain's damage is (rank − N) × 2: 2 more each rank, as the step says.)
        || Number(adapted.rank) - Number(failure[6]) < 1) return null;
    const held = failure[3];
    return {
        html: `<p>${lead[1]} The target takes ${formula} ${type} damage and must attempt a ${lead[2]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes full damage.</p><p><strong>Failure</strong> The target takes full damage and is ${held} until the end of your next turn or until it Escapes.</p>`
            + `<p><strong>Critical Failure</strong> The target takes full damage and is ${held} and ${critical[1]} until the end of your next turn or until it Escapes.</p>${heightened ? `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[2]}.</p>` : ""}`,
        hold: { degrees: ["failure", "criticalFailure"], formula: failure[5], type, slug: failure[4].toLowerCase(), label: "Sustain: the lasso",
            sourceText: htmlToPlainText(row("Failure")).replace(/\s+/g, " ").trim().split(/(?<=Escape\.)\s+/)[1] },
        sentences: [htmlToPlainText(body).replace(/\s+/g, " ").trim(), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => `${h} ${htmlToPlainText(row(h)).replace(/\s+/g, " ").trim()}`),
            htmlToPlainText(heightened).trim(), htmlToPlainText(row("Failure")).replace(/\s+/g, " ").trim().split(/(?<=Escape\.)\s+/)[1]]
    };
}
