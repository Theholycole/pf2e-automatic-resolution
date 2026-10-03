// A mood that spreads at the target's turns (Infectious Ennui): "… the targeted creature, who must attempt a Will save." with rows "The target is momentarily
// overwhelmed with ennui. It becomes {Slowed 1} as it grapples …, but at the end of the target's next turn, the spell effect ends." / "The target is slowed 1 and
// {Frightened 1} from the sense of ennui, and remains slowed and can't reduce the frightened condition below 1 as long as the spell is sustained. At the start of
// the target's turn, choose one creature within 30 feet of the target to attempt a Will save as well; on a failure, that creature is slowed 1 for 1 round;
// either way, they are then temporarily immune to this casting of infectious ennui. (Ennui does not continue to spread from this secondary target.)" / "As
// failure, but the primary target is {Slowed 2} and {Frightened 2}." and "Heightened (5th) When a secondary target becomes slowed, it remains slowed as long as
// the spell is sustained.": the rows for the sustained spell (Slowed until the end of the target's next turn; Slowed and Frightened with the frightened floor
// while the spell lasts); the spread a save of its own the GM starts from a card at each of the target's turns (immune to this casting either way; from 5th, the
// spread's Slowed lasts as long as the original cast).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+) (\d)\}`;
const LEAD = /^[^.]*\bthe targeted creature, who must attempt an? (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^The target is momentarily overwhelmed with [a-z]+\. It becomes ${C} as it [a-z ,'-]+, but at the end of the target's next turn, the spell effect ends\.$`);
const FAILURE = new RegExp(String.raw`^The target is ([a-z]+) (\d) and ${C} from the sense of [a-z]+, and remains ([a-z]+) and can't reduce the ([a-z]+) condition below (\d) as long as the spell is sustained\. `
    + String.raw`At the start of the target's turn, choose one creature within (\d+) feet of the target to attempt an? (Fortitude|Reflex|Will) save as well; on a failure, that creature is ([a-z]+) (\d) for 1 round; `
    + String.raw`either way, they are then temporarily immune to this casting of [a-z ]+\. \([A-Z][a-z]+ does not continue to spread from this secondary target\.\)$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the primary target is ${C} and ${C}\.$`);
const HEIGHTENED = /^<p><strong>Heightened \((\d)(?:st|nd|rd|th)\)<\/strong>\s*When a secondary target becomes ([a-z]+), it remains \2 as long as the spell is sustained\.<\/p>$/;

/** {mainHTML, spreadHTML, heightenedSpreadHTML, heightenedRank, radius, statistic, sentences} or null. */
export function extractSpreadingMood(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    const high = heightened ? HEIGHTENED.exec(heightened.replace(/\s+/g, " ")) : null;
    if (!lead || rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The target is unaffected." || !success || !failure || !critical || (heightened && !high)) return null;
    const statistic = lead[1];
    // failure: [1] slowed [2] 1 [3] uuid [4] Frightened [5] 1 [6] slowed [7] frightened [8] 1 [9] radius [10] save [11] slowed [12] 1
    const slowed = success[2].toLowerCase(), slowedUuid = success[1], frightened = failure[4].toLowerCase();
    if (failure[1] !== slowed || failure[6] !== slowed || failure[11] !== slowed || failure[7] !== frightened || failure[8] !== failure[5] || failure[10] !== statistic
        || critical[2].toLowerCase() !== slowed || critical[5].toLowerCase() !== frightened || (high && high[2] !== slowed) || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const link = (uuid, name, value) => `@UUID[${uuid}]{${name} ${value}}`;
    const floor = value => `The ${frightened} value can't be reduced below ${value} while the spell is active.`;
    const mainHTML = `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
        + `<p><strong>Success</strong> The target is ${link(slowedUuid, success[2], success[3])} until the end of its next turn.</p>`
        + `<p><strong>Failure</strong> The target is ${link(slowedUuid, success[2], failure[2])} and ${link(failure[3], failure[4], failure[5])}. ${floor(failure[5])}</p>`
        + `<p><strong>Critical Failure</strong> The target is ${link(critical[1], critical[2], critical[3])} and ${link(critical[4], critical[5], critical[6])}. ${floor(critical[6])}</p>`;
    const spread = lasting => `<p>The creature must attempt a ${failure[10]} save and is then temporarily immune for 1 minute.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
        + `<p><strong>Success</strong> The target is unaffected.</p>`
        + ["Failure", "Critical Failure"].map(heading => `<p><strong>${heading}</strong> The target is ${link(slowedUuid, success[2], failure[12])}${lasting ? "" : " for 1 round"}.</p>`).join("");
    const plain = text => htmlToPlainText(text).replace(/\s+/g, " ").trim();
    return {
        mainHTML, spreadHTML: spread(false), heightenedSpreadHTML: high ? spread(true) : null, heightenedRank: high ? Number(high[1]) : null,
        radius: Number(failure[9]), statistic, degrees: ["failure", "criticalFailure"],
        sentences: [plain(body), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => plain(row(heading))), ...(heightened ? [plain(heightened)] : [])],
        sourceText: plain(row("Failure"))
    };
}
