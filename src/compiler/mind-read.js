// A glimpse into the target's mind (Mind Reading): "With a cursory mental touch, you attempt to read the target's mind. It must attempt a Will save.
// The target then becomes temporarily immune to your mind reading for 1 hour." with rows "The target perceives vague surface thoughts from you when you
// Cast the Spell." / "You find out whether the target's Intelligence modifier is higher than, equal to, or lower than yours." / "You perceive vague
// surface thoughts from the target when you Cast the Spell, and you find out whether its Intelligence is higher than, equal to, or lower than yours." /
// "As failure, and for the duration of the spell, you can Sustain the spell to detect the target's surface thoughts again. The target doesn't receive
// any additional saves.": the immunity to this caster for every result; the Intelligence comparison read from PF2e and whispered to the GM and the
// caster (user decision 2026-10-01); the surface thoughts the GM's (a note on the failing rows, the critical failure's for the sustained minute).
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^With a cursory mental touch, you attempt to read the target's mind\. It must attempt a (Fortitude|Reflex|Will) save\. The target then becomes temporarily immune to your mind reading for (\d+) (minute|hour)s?\.$/;
const ROWS = {
    "Critical Success": /^The target perceives vague surface thoughts from you when you Cast the Spell\.$/,
    Success: /^You find out whether the target's Intelligence modifier is higher than, equal to, or lower than yours\.$/,
    Failure: /^You perceive vague surface thoughts from the target when you Cast the Spell, and you find out whether its Intelligence is higher than, equal to, or lower than yours\.$/,
    "Critical Failure": /^As failure, and for the duration of the spell, you can Sustain the spell to detect the target's surface thoughts again\. The target doesn't receive any additional saves\.$/
};

/** {html, notes, immunity, reminder, sentences} or null. */
export function rewriteMindRead(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length || adapted.lifecycle?.sustained !== true) return null;
    const sustained = /^1 round or sustained up to (\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !sustained) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || Object.entries(ROWS).some(([heading, pattern]) => !pattern.test(plain(heading)))) return null;
    const round = { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: "1 round" };
    const reveal = { kind: "intelligence-compare", timing: "now" };
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr />` + Object.keys(ROWS).map(heading => `<p><strong>${heading}</strong> The target is unaffected.</p>`).join(""),
        notes: {
            success: { label: "Mind read", text: "The caster learns whether its Intelligence modifier is higher than, equal to, or lower than theirs (whispered to the GM and the caster).", sourceText: plain("Success"), claimsRow: true, gmPlays: true, reveal, duration: { ...round } },
            failure: { label: "Mind read", text: "The caster perceives its vague surface thoughts (the GM describes them) and learns how its Intelligence modifier compares (whispered).", sourceText: plain("Failure"), claimsRow: true, gmPlays: true, reveal, duration: { ...round } },
            criticalFailure: { label: "Mind read", text: "The caster perceives its vague surface thoughts (the GM describes them) and learns how its Intelligence modifier compares (whispered). While the caster Sustains the spell, each Sustain detects its surface thoughts again, with no new save; end this when the spell ends.",
                sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true, reveal, duration: { mode: "fixed", value: Number(sustained[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `sustained up to ${sustained[1]} minute${sustained[1] === "1" ? "" : "s"}` } }
        },
        immunity: { byCaster: true, degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], duration: { value: Number(lead[2]), unit: `${lead[3]}s` }, sourceText: lead[0] },
        reminder: { kind: "spell-note", text: "On a critical success the target perceives the caster's vague surface thoughts (the GM describes them).", sourceText: `Critical Success ${plain("Critical Success")}` },
        sentences: [lead[0], ...Object.keys(ROWS).map(heading => `${heading} ${plain(heading)}`)]
    };
}
