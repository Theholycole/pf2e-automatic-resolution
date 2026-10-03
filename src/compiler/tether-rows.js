// A target whose paths lead to the caster (Inevitable Destination): "You twist the paths of the target, ensuring that each one leads to you. The target
// attempts a Will saving throw." with rows "The spell has no effect." / "Your pull hampers the target's footsteps. It takes a –10-foot circumstance
// penalty to its Speeds until the end of its next turn." / "The target can't move any farther from you than it was when you Cast the Spell, though it
// can move in such a way that it maintains an equal distance. If you move farther away from the target than the initial distance, the spell ends.
// The targeted foe can attempt to @UUID[…]{Escape} against your spell DC. If it succeeds, the spell ends." / "As failure, plus the target is pulled
// 10 feet closer to you and falls @UUID[…]{Prone}, tripping in its haste to move toward you.": the success's Speed penalty; the tether a note for
// the spell's time that an Escape ends; the critical failure's pull (the GM's) and Prone. Only the enemy is targeted ("you and 1 enemy").
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^You twist the paths of the target, ensuring that each one leads to you\. The target attempts a (Fortitude|Reflex|Will) saving throw\.$/;
const SUCCESS = /^Your pull hampers the target's footsteps\. It takes a [–−-](\d+)-foot (circumstance|status) penalty to its Speeds until the end of its next turn\.$/;
const FAILURE = /^(The target can't move any farther from you than it was when you Cast the Spell, though it can move in such a way that it maintains an equal distance\.) (If you move farther away from the target than the initial distance, the spell ends\.) The targeted foe can attempt to (?:@UUID\[[^\]]+\]\{Escape\}|Escape) against your spell DC\. If it succeeds, the spell ends\.$/;
const CRITICAL = new RegExp(String.raw`^As failure, plus the target is pulled (\d+) feet closer to you and falls (${C}Prone\}), tripping in its haste to move toward you\.$`);

/** {html, hampered, tether, pull, sentences} or null. */
export function rewriteTetherRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^you and 1 enemy$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const duration = /^(\d+) rounds?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !duration) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(plain("Success")), failure = FAILURE.exec(plain("Failure")), critical = CRITICAL.exec(row("Critical Failure").replace(/\s+/g, " "));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || !/^The spell has no effect\.$/.test(plain("Critical Success")) || !success || !failure || !critical) return null;
    const rounds = Number(duration[1]);
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is ${critical[2]}.</p>`,
        // (The Speed penalty as the note's PF2e rule: the spell's 2 rounds keep it from being a generated modifier of an instantaneous save.)
        hampered: { label: "Hampered footsteps", text: `A –${success[1]}-foot ${success[2]} penalty to its Speeds until the end of its next turn.`, sourceText: plain("Success"), claimsRow: true,
            rules: [{ key: "FlatModifier", selector: "all-speeds", type: success[2], value: -Number(success[1]) }],
            duration: { mode: "fixed", value: 1, unit: "rounds", expiry: "turn-end", anchor: "target-turn", offset: 1, sourceText: "until the end of its next turn" } },
        tether: { label: "Tethered", text: `${failure[1].replace(/from you/, "from the caster").replace(/when you Cast/, "when the caster Cast")} ${failure[2].replace(/^If you move/, "If the caster moves")} A successful Escape against the spell DC ends the spell.`,
            sourceText: plain("Failure"), claimsRow: true, gmPlays: true, escape: true,
            duration: { mode: "fixed", value: rounds, unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${rounds} rounds` } },
        pull: { kind: "pull", distance: Number(critical[1]), upTo: false, optional: false, direction: "toward" },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
