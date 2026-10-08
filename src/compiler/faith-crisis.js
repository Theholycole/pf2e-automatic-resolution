// Doubt that hits a divine caster harder (Crisis of Faith): "You assault the target's faith, riddling the creature with doubt and mental turmoil that deal
// 6d6 mental damage, or 6d8 mental damage if it can cast divine spells. The effects are determined by its Will save." / "To many deities, casting this
// spell on a follower of your own deity without significant cause is anathema." with rows "… half damage." / "The target takes full damage; if the target
// can cast divine spells, it's Stupefied 1 for 1 round." / "The target takes double damage, is Stupefied 1 for 1 round, and can't cast divine spells for 1
// round." and "Heightened (+1) The damage increases by 2d6 (or by 2d8 if the target is a divine spellcaster).": the caster's question on the card (a
// divine spellcaster? its dice d8, heightened ones too); the failure's Stupefied only on a yes; the critical failure's Stupefied and its ban a note;
// the anathema a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C } from "./text-patterns.js";

const LEAD = /^You assault the target's faith, riddling the creature with doubt and mental turmoil that deal (\d+)d(\d+) ([a-z]+) damage, or \1d(\d+) \3 damage if it can cast divine spells\. The effects are determined by its (Fortitude|Reflex|Will) save\.$/;
const ANATHEMA = /^To many deities, casting this spell on a follower of your own deity without significant cause is anathema\.$/;
const FAILURE = new RegExp(String.raw`^The target takes full damage; if the target can cast divine spells, it's (${C}Stupefied (\d)\}) for (\d+) rounds?\.$`);
const CRITICAL = new RegExp(String.raw`^The target takes double damage, is (${C}Stupefied (\d)\}) for (\d+) rounds?, and can't cast divine spells for (\d+) rounds?\.$`);
const STEP = /^Heightened \(\+1\) The damage increases by (\d)d(\d+) \(or by \1d(\d+) if the target is a divine spellcaster\)\.$/;

/** {html, upgrade, ban, reminder, sentences} or null. */
export function rewriteFaithCrisis(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = LEAD.exec(paragraphs[0] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2 || !lead || !ANATHEMA.test(paragraphs[1]) || lead[5].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The target is unaffected."
        || plain("Success") !== "The target takes half damage." || !failure || !critical || !step || step[2] !== lead[2] || step[3] !== lead[4]) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `${lead[1]}d${lead[2]}` || String(components[0].type).toLowerCase() !== lead[3]) return null;
    return {
        html: `<p>The target takes ${lead[1]}d${lead[2]} ${lead[3]} damage and must attempt a ${lead[5]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes half damage.</p><p><strong>Failure</strong> The target takes full damage and is ${failure[1]} for ${failure[3]} round${failure[3] === "1" ? "" : "s"}.</p>`
            + `<p><strong>Critical Failure</strong> The target takes double damage and is ${critical[1]} for ${critical[3]} round${critical[3] === "1" ? "" : "s"}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        upgrade: { faces: Number(lead[4]), question: "Can the target cast divine spells? If so, its damage dice are d8s (and a failure also leaves it Stupefied 1 for 1 round)." },
        ban: { label: "Faith shaken", text: "It can't cast divine spells.", sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true,
            duration: { mode: "fixed", value: Number(critical[4]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${critical[4]} round${critical[4] === "1" ? "" : "s"}` } },
        reminder: { kind: "spell-note", text: paragraphs[1], sourceText: paragraphs[1] },
        sentences: [...paragraphs, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`), step[0]]
    };
}
