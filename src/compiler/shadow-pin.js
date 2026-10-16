// A save whose targets are counted by the actions spent and whose hold ends on an Escape stated after the row (Pin the Spears in the Lamb, PF2e 8.6):
//   "For each action you spend Casting this Spell, you can target one creature within range." / "Each target must attempt a Reflex save." with rows
//   "The target is unaffected." / "The target takes a –10-foot status penalty to its Speeds for 1 round." / "The target is {Immobilized} for 1 round. An affected
//   creature can Escape its shadow's grasp with a check against your spell DC to end the effect." / "As failure, but the target is immobilized for 1 minute."
// Rewritten to each target's own save with its rows (the hold until it Escapes against the spell DC, on both failing rows); how many it may target — one per
// action, each with a shadow — is the caster's reminder.
import { htmlToPlainText } from "./description-parser.js";

const BY_ACTIONS = /^For each action you spend Casting this Spell, you can target one creature within range\.$/;
const SAVE = /^Each target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: /^The target is unaffected\.$/,
    success: /^The target takes an? [–−-](\d+)-foot (status|circumstance) penalty to its Speeds for (\d+) rounds?\.$/,
    failure: /^The target is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Immobilized\}) for (\d+) rounds?\. An affected creature can Escape its [a-z' ]+ with a check against your spell DC to end the effect\.$/,
    criticalFailure: /^As failure, but the target is immobilized for (\d+) minutes?\.$/
};
const HEADINGS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|save|bonus|penalty|condition|immune|must|each|Speed)\b/i;

/** {html, target, reminder, sentences} or null. */
export function extractShadowPin(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    if (!/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const target = /^1 or more creatures(?: (that have shadows))?$/i.exec(String(adapted.targeting?.target ?? "").trim());
    if (!target) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = lead.findIndex(sentence => BY_ACTIONS.test(sentence));
    if (at < 0 || lead.length !== at + 2 || lead.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const save = SAVE.exec(lead[at + 1]);
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const text = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>\s*([\s\S]*?)</p>`).exec(table)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
        rows[degree] = ROWS[degree].exec(text);
        if (!rows[degree]) return null;
    }
    if ((table.match(/<p>/g) ?? []).length !== 4) return null;
    const [, feet, type, rounds] = rows.success, [, immobilized, failRounds] = rows.failure, [, minutes] = rows.criticalFailure;
    const plural = (count, unit) => `${count} ${unit}${count === "1" ? "" : "s"}`;
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target takes a –${feet}-foot ${type} penalty to its Speeds for ${plural(rounds, "round")}.</p>`
            + `<p><strong>Failure</strong> The target is ${immobilized} for ${plural(failRounds, "round")} or until it Escapes against your spell DC.</p>`
            + `<p><strong>Critical Failure</strong> The target is ${immobilized} for ${plural(minutes, "minute")} or until it Escapes against your spell DC.</p>`,
        target: "1 creature",
        reminder: { kind: "targets-by-actions", text: `One target for each action spent Casting the Spell (1 to 3)${target[1] ? ", each a creature with a shadow" : ""}.`, sourceText: lead[at] },
        sentences: [...lead, ...Object.values(rows).map(match => htmlToPlainText(match[0]))]
    };
}
