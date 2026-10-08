// A save whose failing rows start an escalating condition (Glacial Heart):
//   "… The frosty assault deals 10d6 cold damage, subject to the target's Fortitude save. After the effects are resolved, the target is
//   temporarily immune for 1 day." with rows "Success The target takes half damage and is slowed 1 for 1 round. The spell ends." / "Failure The
//   target takes full damage, is @UUID[…]{Slowed 1}, and must attempt a Fortitude save at the end of each of its turns; this ongoing save has the
//   incapacitation trait. On a failed save, the slowed condition increases by 1 (or 2 on a critical failure), to a maximum of slowed 4. On a
//   success, the slowed condition decreases by 1. If at any point the slowed condition is reduced to 0, the spell ends." / (the encasing ice) /
//   "Critical Failure As failure, but the target takes double damage and is initially @UUID[…]{Slowed 2}."
// The rows written out plainly; the failing rows' Slowed carries an "escalate" end-of-turn save (failure +1, critical failure +2, success −1,
// at most 4; at 0 it ends). The encasing ice is a GM note on those rows.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES, PETRIFIED_UUID } from "./text-patterns.js";

const DEALS = /^The [a-z ]+ deals (\d+d\d+) ([a-z]+) damage, subject to the target's (Fortitude|Reflex|Will) save\.$/;
const IMMUNE = /^After the effects are resolved, the target is temporarily immune for (?:1|one) (day|hour|minute)\.$/;
const SUCCESS = /^The target takes half damage and is slowed (\d) for (\d+) (round|minute)s?\. The spell ends\.$/;
const FAILURE = new RegExp(String.raw`^The target takes full damage, is (${C}([A-Z][a-z]+) (\d)\}), and must attempt an? (Fortitude|Reflex|Will) save at the end of each of its turns; this ongoing save has the incapacitation trait\. On a failed save, the ([a-z]+) condition increases by (\d) \(or (\d) on a critical failure\), to a maximum of [a-z]+ (\d)\. On a success, the \5 condition decreases by (\d)\. If at any point the \5 condition is reduced to 0, the spell ends\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the target takes double damage and is initially (${C}([A-Z][a-z]+) (\d)\})\.$`);
const ICE = /^Once a creature's actions are reduced to 0 by this [a-z]+ condition, the creature is completely encased in ice\./;

/** {html, recurring, note, claimed} or null. */
export function rewriteEscalatingRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false) return null;
    const components = adapted.damageComponents ?? [];
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    if (components.length !== 1 || components[0].category || !minutes) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== 3 || NARRATION_RULES.test(lead[0]) || !IMMUNE.test(lead[2])) return null;
    const deals = DEALS.exec(lead[1]);
    if (!deals || deals[3].toLowerCase() !== adapted.defense.statistic || String(components[0].formula).replace(/\s+/g, "") !== deals[1] || String(components[0].type).toLowerCase() !== deals[2]) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(text => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(text))?.replace(/^<strong>[^<]*<\/strong>\s*/, "");
    const iceIndex = paragraphs.findIndex(text => ICE.test(htmlToPlainText(text)));
    if (paragraphs.length !== 5 || iceIndex !== 3 || row("Critical Success") !== "The target is unaffected.") return null;
    const success = SUCCESS.exec(row("Success") ?? ""), failure = FAILURE.exec(row("Failure") ?? ""), critical = CRITICAL.exec(row("Critical Failure") ?? "");
    if (!success || !failure || !critical || failure[2] !== critical[2] || failure[5] !== failure[2].toLowerCase() || failure[4].toLowerCase() !== adapted.defense.statistic) return null;
    const [, slowedLink, name, , , slug, up, upCritical, maximum, down] = failure;
    const ice = htmlToPlainText(paragraphs[3]);
    const span = `for ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}`;
    return {
        html: `<p>The target must attempt a ${deals[3]} save. ${lead[2]}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage and is ${slowedLink.replace(/ \d\}$/, ` ${success[1]}}`)} for ${success[2]} ${success[3]}${success[2] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${slowedLink} ${span}.</p><p><strong>Critical Failure</strong> The target takes double damage and is ${critical[1]} ${span}.</p>${rest.length ? `<hr />${rest[0]}` : ""}`,
        recurring: { slug, timing: "turn-end", mode: "escalate", statistic: failure[4].toLowerCase(), steps: { criticalSuccess: -Number(down), success: -Number(down), failure: Number(up), criticalFailure: Number(upCritical) },
            maximum: Number(maximum), sourceText: htmlToPlainText(row("Failure")) },
        note: { label: "Encased in ice", text: `${ice} (The GM plays the ice. The end-of-turn save has the incapacitation trait.)`, sourceText: ice, gmPlays: true,
            duration: { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: span } },
        claimed: [...lead, ...paragraphs.map(text => htmlToPlainText(text))]
    };
}

// A slowed condition that turns to stone (Petrify, Lignify): "Success The target is {Slowed 1} for 1 round (as …)." / "Failure The target is slowed 1 and must attempt
// a Fortitude save at the end of each of its turns; this ongoing save has the incapacitation trait. On a failed save, the slowed condition increases by 1 (or 2 on a
// critical failure)( as …). A successful save reduces the slowed condition by 1. When a creature becomes fully unable to act due to the slowed condition from petrify,
// the spell then ends …, leaving the target {Petrified} permanently …. The spell also ends if the slowed condition is removed, …" (Lignify: "… the creature is
// permanently non-magically petrified, though it's turned to wood instead of stone. The spell ends if the creature is magically petrified or the slowed condition is
// removed.") / "Critical Failure As failure, but the target is initially {Slowed 2}." — the failing rows' Slowed for an unlimited time with an "escalate"
// end-of-turn save (failure +1, critical failure +2, success −1; at 0 it ends); at the creature's action count (3, or 4 when Quickened) it's Petrified permanently
// and the spell ends. Lignify's "+2 circumstance bonus to saves against this spell" for plant creatures is a rule on the save (trait-predicated).
const STONE = {
    success: new RegExp(String.raw`^The target is (${C}Slowed (\d)\}) for (\d+) (round|minute)s?(?: as [^.]+)?\.$`),
    failure: /^The target is slowed (\d) and must attempt an? (Fortitude|Reflex|Will) save at the end of each of its turns; this ongoing save has the incapacitation trait\. On a failed save, the slowed condition increases by (\d) \(or (\d) on a critical failure\)(?: as [^.]+)?\. A successful save reduces the slowed condition by (\d)\. (When a creature (?:becomes fully|is) unable to act due to the slowed condition from [a-z ]+, (?:the spell then ends[^,]*, leaving the target (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Petrified\}) permanently[^.]*|the creature is permanently non-magically petrified, though it's turned to [a-z]+ instead of stone)\.) (The spell (?:also )?ends if (?:the creature is magically petrified or )?the slowed condition is removed[^.]*\.)$/,
    critical: new RegExp(String.raw`^As failure, but the target is initially (${C}Slowed (\d)\})\.$`),
    plantBonus: /^Creatures with the ([a-z]+) trait have a \+(\d) circumstance bonus to saves against this spell\.$/
};

/** {html, recurring, saveBonus, claimed} or null. */
export function rewritePetrifyingRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained) return null;
    if (!/^varies$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const must = new RegExp(`^The target must attempt an? ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save\\.$`);
    if (lead.length < 2 || lead.length > 3 || NARRATION_RULES.test(lead[0]) || !must.test(lead[1])) return null;
    const plant = lead[2] ? STONE.plantBonus.exec(lead[2]) : null;
    if (lead[2] && !plant) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(text => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(text))?.replace(/^<strong>[^<]*<\/strong>\s*/, "");
    if (paragraphs.length !== 4 || row("Critical Success") !== "The target is unaffected.") return null;
    const success = STONE.success.exec(row("Success") ?? ""), failure = STONE.failure.exec((row("Failure") ?? "").replace(/<\/?em>/g, ""));
    const critical = STONE.critical.exec(row("Critical Failure") ?? "");
    if (!success || !failure || !critical || failure[2].toLowerCase() !== adapted.defense.statistic) return null;
    const slowed = success[1].replace(/ \d\}$/, "");
    return {
        html: `<p>${lead[0]} ${lead[1]}</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${success[1]} for ${success[3]} ${success[4]}${success[3] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Failure</strong> The target is ${slowed} ${failure[1]}} for an unlimited duration.</p><p><strong>Critical Failure</strong> The target is ${critical[1]} for an unlimited duration.</p>`,
        recurring: { slug: "slowed", timing: "turn-end", mode: "escalate", statistic: failure[2].toLowerCase(), steps: { criticalSuccess: -Number(failure[5]), success: -Number(failure[5]), failure: Number(failure[3]), criticalFailure: Number(failure[4]) },
            maximum: 4, atActions: { uuid: PETRIFIED_UUID, slug: "petrified", sourceText: htmlToPlainText(failure[6]) }, sourceText: htmlToPlainText(row("Failure").replace(/<\/?em>/g, "")) },
        saveBonus: plant ? { trait: plant[1], value: Number(plant[2]), type: "circumstance", sourceText: lead[2] } : null,
        claimed: [...lead, ...paragraphs.map(text => htmlToPlainText(text))]
    };
}
