// Illusions of what the target wants most (Heart's Desire): "You surround your target with wondrous illusions of their greatest desires, which distract them
// from reality. The target must attempt a Will save." with rows "The target disbelieves the illusion and is unaffected." / "For 1 round, the target is
// Stupefied 2 and takes a -2 status penalty to any checks it makes to determine the effects of reactions." / "For 1 minute, the target is stupefied 2 and can't
// use reactions." / "As failure, and all spaces are difficult terrain for the target.": Stupefied 2 for each row's time; the reaction penalty, the lost
// reactions and the difficult terrain notes for the same time.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const LEAD = /^You surround your target with wondrous illusions of their greatest desires, which distract them from reality\. The target must attempt a (Fortitude|Reflex|Will) save\.$/;
const SUCCESS = new RegExp(String.raw`^For (\d+) (round|minute)s?, the target is (${C}Stupefied (\d)\}) and takes a [-–−](\d) (status|circumstance) penalty to any checks it makes to determine the effects of reactions\.$`);
const FAILURE = /^For (\d+) (round|minute)s?, the target is stupefied (\d) and can't use reactions\.$/;
const CRITICAL = /^As failure, and all spaces are difficult terrain for the target\.$/;

/** {html, notes, sentences} or null. */
export function rewriteDesireRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const plain = heading => htmlToPlainText(row(heading)).replace(/\s+/g, " ").trim();
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(plain("Failure"));
    if (!lead || lead[1].toLowerCase() !== adapted.defense.statistic || rows.length !== 4 || plain("Critical Success") !== "The target disbelieves the illusion and is unaffected."
        || !success || !failure || !CRITICAL.test(plain("Critical Failure")) || failure[3] !== success[4]) return null;
    const time = (value, unit) => ({ mode: "fixed", value: Number(value), unit: `${unit}s`, expiry: unit === "round" ? "turn-start" : null, anchor: "effect-start", offset: 0, sourceText: `${value} ${unit}${value === "1" ? "" : "s"}` });
    const words = (value, unit) => `${value} ${unit}${value === "1" ? "" : "s"}`;
    const note = (heading, text, value, unit) => ({ label: "Heart's desire", text, sourceText: plain(heading), claimsRow: true, gmPlays: true, duration: time(value, unit) });
    return {
        html: `<p>The target must attempt a ${lead[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is ${success[3]} for ${words(success[1], success[2])}.</p>`
            + `<p><strong>Failure</strong> The target is ${success[3]} for ${words(failure[1], failure[2])}.</p>`
            + `<p><strong>Critical Failure</strong> The target is ${success[3]} for ${words(failure[1], failure[2])}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        notes: {
            success: note("Success", `A –${success[5]} ${success[6]} penalty to any check it makes to determine the effects of its reactions.`, success[1], success[2]),
            failure: note("Failure", "It can't use reactions.", failure[1], failure[2]),
            criticalFailure: note("Critical Failure", "It can't use reactions, and every space is difficult terrain for it.", failure[1], failure[2])
        },
        sentences: [lead[0], ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${plain(heading)}`)]
    };
}
