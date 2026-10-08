// A Strike that sets up a later shock (Magus+'s Hyper-Arcane Pressure Point Strike): "Make a Strike with the required unarmed attack. If you hit, on subsequent turns during
// the duration you can spend a single action with the concentrate trait during the duration to activate your pressure point magic and the target must attempt a
// @Check[type:fortitude|…] against your spell DC, after which the spell immediately ends." with rows "The target is unaffected." / "The target's muscles surge with pain and
// they become temporarily weaker. Roll damage for the required unarmed Strike again and the target takes half damage and is Enfeebled 1 for 1 round." / "As success, except
// the target takes full damage and any time it attempts to take an action with the manipulate trait while enfeebled, the target must succeed at a flat check with a DC equal
// to 5 + its enfeebled value or the action is disrupted." / "As failure, but the target takes double damage and is Enfeebled 2.": the Strike the caster's; the creature it
// hit marked for the minute; the card's option — the activation's Fortitude save (the caster's unarmed Strike's damage, read when cast, by the row; Enfeebled for 1 round;
// the flat check a note), which ends the spell.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You jab your fingers quickly into pressure points in your opponents body in such a way that you channel up strange arcane shocks through their body\. Make a Strike with the required unarmed attack\. (If you hit, on subsequent turns during the duration you can spend a single action with the concentrate trait during the duration to activate your pressure point magic and the target must attempt a) @Check\[(?:type:)?(fortitude|reflex|will)[^\]]*\] against your spell DC, after which the spell immediately ends\.$/;
const ROWS = {
    criticalSuccess: /^The target is unaffected\.$/,
    success: /^The target's muscles surge with pain and they become temporarily weaker\. Roll damage for the required unarmed Strike again and the target takes half damage and is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{Enfeebled (\d)\} for (\d) rounds?\.$/,
    failure: /^As success, except the target takes full damage and (any time it attempts to take an action with the manipulate trait while enfeebled, the target must succeed at a flat check with a DC equal to 5 \+ its enfeebled value or the action is disrupted)\.$/,
    criticalFailure: /^As failure, but the target takes double damage and is @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Enfeebled (\d)\}\.$/
};

/** {saveHTML, statistic, flat, sentences} or null. */
export function extractPressurePoint(item) {
    if (!/^1 minute$/.test(String(item?.system?.duration?.value ?? "").trim()) || item.system?.defense?.save || Object.keys(item.system?.damage ?? {}).length
        || !/unarmed attack/i.test(String(item.system?.requirements ?? ""))) return null;
    const html = String(item.system?.description?.value ?? "").replace(/<p data-visibility="owner">[\s\S]*?<\/p>/g, "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").replace(/’/g, "'").trim() ?? "";
    const lead = LEAD.exec(String(paragraphs[0] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    const success = ROWS.success.exec(row("Success")), failure = ROWS.failure.exec(row("Failure")), critical = ROWS.criticalFailure.exec(row("Critical Failure"));
    if (paragraphs.length !== 5 || !lead || !ROWS.criticalSuccess.test(row("Critical Success")) || !success || !failure || !critical) return null;
    const statistic = lead[2], Statistic = statistic[0].toUpperCase() + statistic.slice(1);
    const link = value => `@UUID[${success[1]}]{Enfeebled ${value}}`;
    return {
        saveHTML: `<p>The target must attempt a ${Statistic} save.</p><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage and is ${link(success[2])} for ${success[3]} round${success[3] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${link(success[2])} for ${success[3]} round${success[3] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${link(critical[1])} for ${success[3]} round${success[3] === "1" ? "" : "s"}.</p>`,
        statistic, rounds: Number(success[3]),
        flat: `${failure[1][0].toUpperCase()}${failure[1].slice(1)}.`,
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => htmlToPlainText(row(heading)))]
    };
}
