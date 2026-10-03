// A joke that spreads (Infectious Comedy): "You tell a magical joke and infect a target with laughter that spreads to those nearby. The first time you Sustain
// the Spell each round, you can target another creature you can see that is within 30 feet of an affected target. The new target need not be able to see or hear the
// affected target, as the humor spreads magically. You can't target the same creature more than once with this spell." with rows "… begins giggling and can't use
// reactions." / "The target is Slowed 1 and can't use reactions." / "The target falls Prone and can't use actions or reactions for 1 round. It then suffers the
// failure effect.": the rows for the sustained spell (Slowed 1 a condition; no reactions, the critical failure's lost round notes; Prone); the spread a card for each
// Sustain (the GM targets the new creature; its save posts no card).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^You tell a magical joke and infect a target with laughter that spreads to those nearby\. (The first time you Sustain the Spell each round, you can target another creature you can see that is within (\d+) feet of an affected target\.) (The new target need not be able to see or hear the affected target, as the humor spreads magically\.) (You can't target the same creature more than once with this spell\.)$/;
const FAILURE = new RegExp(String.raw`^The target is (${C}Slowed (\d)\}) and can't use reactions\.$`);
const CRITICAL = new RegExp(String.raw`^The target falls (${C}Prone\}) and can't use actions or reactions for (\d+) rounds?\. It then suffers the failure effect\.$`);

/** {html, notes, chain, reminder, sentences} or null. */
export function rewriteComedyRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length || !minutes) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (!lead || rows.length !== 4 || plain("Critical Success") !== "The target is unaffected." || plain("Success") !== "The target begins giggling and can't use reactions." || !failure || !critical) return null;
    const statistic = `${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)}`;
    const spellTime = { mode: "fixed", value: Number(minutes[1]), unit: "minutes", expiry: null, anchor: "effect-start", offset: 0, sourceText: `sustained up to ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}` };
    const giggles = (heading, text) => ({ label: "Giggling", text, sourceText: plain(heading), claimsRow: true, gmPlays: true, duration: { ...spellTime } });
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[1]} for the spell's duration.</p><p><strong>Critical Failure</strong> The target is ${critical[1]} and ${failure[1]} for the spell's duration.</p>`,
        notes: {
            success: giggles("Success", "It can't use reactions while the spell lasts."),
            failure: giggles("Failure", "It can't use reactions while the spell lasts."),
            criticalFailure: [giggles("Critical Failure", "It can't use reactions while the spell lasts."),
                { label: "Doubled over", text: "It can't use actions or reactions.", sourceText: plain("Critical Failure"), claimsRow: true, gmPlays: true,
                    duration: { mode: "fixed", value: Number(critical[2]), unit: "rounds", expiry: "turn-start", anchor: "effect-start", offset: 0, sourceText: `${critical[2]} round${critical[2] === "1" ? "" : "s"}` } }]
        },
        chain: { perCast: true, repeatable: true, cascade: false, label: `new target within ${lead[2]} feet of an affected one`, sourceText: lead[1] },
        reminder: { kind: "spell-note", text: `${lead[3]} ${lead[4]} The first time each round the caster Sustains, press the spread card with the new target targeted.`, sourceText: lead[0] },
        sentences: [lead[0], lead[1], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
