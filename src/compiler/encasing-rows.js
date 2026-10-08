// Rows that encase the target more with each degree (Crucible of Iron): "The target's head is encased in iron, causing them to be @UUID[…]{Dazzled}
// for 1 round and take 1d10 persistent fire damage." / "The target's head, arms, and chest are all encased. The target is dazzled and
// @UUID[…]{Enfeebled 1} for 1 minute or until they Escape. They also take 1d10 persistent fire damage." / "The target's legs and feet are also
// encased. The target is dazzled, @UUID[…]{Enfeebled 2}, and @UUID[…]{Immobilized} for 1 minute or until they Escape. They also take 1d10
// persistent fire damage." with "Heightened (+2) The persistent fire damage increases by 1d10.": the rows as their conditions (until the
// creature Escapes, the minute at most) and the persistent damage at the cast rank (the item's entry, the text's step); the body parts are
// narration.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES, MUST_ATTEMPT_SAVE as SAVE } from "./text-patterns.js";

const SUCCESS = new RegExp(String.raw`^The target's [a-z, ]+ (?:is|are) encased in [a-z]+, causing them to be (${C}Dazzled\}) for 1 round and take (\d+)d(\d+) persistent ([a-z]+) damage\.$`);
const FAILURE = new RegExp(String.raw`^The target's [a-z, ]+ are all encased\. The target is dazzled and (${C}Enfeebled \d\}) for 1 minute or until they Escape\. They also take (\d+)d(\d+) persistent ([a-z]+) damage\.$`);
const CRITICAL = new RegExp(String.raw`^The target's [a-z, ]+ are also encased\. The target is dazzled, (${C}Enfeebled \d\}), and (${C}Immobilized\}) for 1 minute or until they Escape\. They also take (\d+)d(\d+) persistent ([a-z]+) damage\.$`);
const STEP = /^Heightened \(\+(\d)\) The persistent ([a-z]+) damage increases by 1d(\d+)\.$/;

/** {html, sentences} or null. */
export function rewriteEncasingRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const save = SAVE.exec(lead.at(-1) ?? "");
    if (lead.length !== 2 || NARRATION_RULES.test(lead[0]) || !save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4 || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !critical || !step) return null;
    const dice = [success.slice(2, 5), failure.slice(2, 5), critical.slice(3, 6)].map(parts => parts.join(" "));
    const [count, faces, type] = success.slice(2, 5);
    if (new Set(dice).size !== 1 || components.length !== 1 || components[0].category !== "persistent" || String(components[0].formula).replace(/\s+/g, "") !== `${count}d${faces}`
        || String(components[0].type).toLowerCase() !== type || step[2] !== type || step[3] !== faces) return null;
    const formula = `@Damage[(${count} + floor((@item.rank - ${Number(adapted.rank)})/${step[1]}))d${faces}[persistent,${type}]]`;
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes ${formula} damage and is ${success[1]} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target takes ${formula} damage and is ${success[1]} and ${failure[1]} for 1 minute or until it Escapes.</p>`
            + `<p><strong>Critical Failure</strong> The target takes ${formula} damage and is ${success[1]}, ${critical[1]}, and ${critical[2]} for 1 minute or until it Escapes.</p>`,
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`), htmlToPlainText(heightened).trim()]
    };
}
