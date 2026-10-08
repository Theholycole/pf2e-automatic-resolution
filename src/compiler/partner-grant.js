// A save by a foe whose rows also grant a condition to a second target, the caster or an ally (Tortoise and the Hare):
//   Target "1 foe, and either yourself or 1 ally"; "… The effects depend on the foe's Fortitude save." with rows "Critical Success The targets
//   are unaffected." / "Success The foe is @UUID[…]{Slowed 1} for 1 round, and the other target is unaffected." / "Failure The foe is slowed 1
//   for 3 rounds and the other target is @UUID[…]{Quickened} for 1 round. It can use the extra action to Step, Stride, or Strike." /
//   "Critical Failure The foe is slowed 1 for 3 minutes and the other target is quickened for 1 minute. It can use the extra action to …".
// The foe's save is an ordinary non-basic save on one enemy (the rows' foe parts). After Finalize, the card offers the other target's condition
// for the foe's result: the caster targets itself or an ally and grants it (once), with the action restriction as a note.
import { htmlToPlainText } from "./description-parser.js";
import { DEGREE_LABEL_PAIRS as DEGREES, NARRATION_RULES_TIMED as NARRATION_RULES } from "./text-patterns.js";

const TARGET = /^(?:1|one) foe, and either yourself or (?:1|one) ally$/i;
const LEAD = /^The effects depend on the foe's (Fortitude|Reflex|Will) save\.$/;
const LINK = /@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{([A-Z][a-z]+)(?: (\d))?\}/g;
const BOTH_UNAFFECTED = /^The targets are unaffected\.$/;
const FOE_ONLY = /^The foe is (.+?),? and the other target is unaffected\.$/;
const BOTH = /^The foe is (.+?),? and the other target is (@UUID\[[^\]]+\]\{[A-Z][a-z]+\}|[a-z]+) for (\d+) (round|minute)s?\.(?: It can use the extra action to ([A-Z][a-z]+(?:, [A-Z][a-z]+)*,? or [A-Z][a-z]+)\.)?$/;

/** Returns {html, target, partner: {rows, restriction}, claimed} or null. */
export function rewritePartnerGrant(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    if (!TARGET.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/Heightened/i.test(html)) return null;
    const [body, table, ...rest] = html.split(/<hr\s*\/?>/i);
    if (rest.length || !table) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (!lead.length || !LEAD.test(lead.at(-1)) || LEAD.exec(lead.at(-1))[1].toLowerCase() !== adapted.defense.statistic || lead.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    // The links the rows use, by name (a later row may name the condition without its link).
    const links = new Map([...html.matchAll(LINK)].map(match => [match[2].toLowerCase(), match[1]]));
    const rows = {}, partner = {}, written = {};
    let restriction = null;
    for (const [, block] of table.matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
        const row = /^<strong>\s*(Critical Success|Success|Failure|Critical Failure)\s*<\/strong>\s*([\s\S]+)$/.exec(block.trim());
        if (!row) return null;
        const degree = DEGREES.find(([, label]) => label === row[1])[0];
        const text = row[2].replace(/\s+/g, " ").trim();
        if (rows[degree]) return null;
        written[degree] = `${row[1]} ${htmlToPlainText(row[2]).replace(/\s+/g, " ").trim()}`;
        if (BOTH_UNAFFECTED.test(text)) { rows[degree] = "The target is unaffected."; continue; }
        const foeOnly = FOE_ONLY.exec(text);
        if (foeOnly) { rows[degree] = `The target is ${foeOnly[1]}.`; continue; }
        const both = BOTH.exec(text);
        if (!both) return null;
        rows[degree] = `The target is ${both[1]}.`;
        const name = (/\{([A-Z][a-z]+)\}$/.exec(both[2])?.[1] ?? both[2]).toLowerCase();
        const uuid = links.get(name);
        if (!uuid) return null;
        if (both[5]) {
            if (restriction && restriction !== both[5]) return null;
            restriction = both[5];
        }
        partner[degree] = { slug: name, name: `${name[0].toUpperCase()}${name.slice(1)}`, uuid, value: null,
            duration: { mode: "fixed", value: Number(both[3]), unit: `${both[4]}s`, expiry: "turn-start", anchor: "effect-start", offset: 0 }, sourceText: text };
    }
    if (DEGREES.some(([degree]) => !rows[degree]) || !Object.keys(partner).length) return null;
    return {
        html: `<p>${lead.slice(0, -1).join(" ")} The target must attempt a ${LEAD.exec(lead.at(-1))[1]} save.</p><hr />${DEGREES.map(([degree, label]) => `<p><strong>${label}</strong> ${rows[degree]}</p>`).join("\n")}`,
        target: "1 enemy",
        partner: { recipient: "caster-or-ally", rows: partner, ...(restriction ? { restriction: `It can use the extra action only to ${restriction}.` } : {}) },
        claimed: [...lead, ...DEGREES.map(([degree]) => written[degree])]
    };
}
