// A curse turning the target bestial (Bestial Curse): rows "The target's body gains minor bestial features. Its insides churn as they partially
// transform, causing it to be @UUID[…]{Clumsy 1} for 1 round. When it recovers from the clumsy condition, its features revert to normal, and the
// spell ends." / "The target transforms into a bestial form for 1 hour. The target becomes clumsy 1 and gains weakness 1 to silver. It gains a claw,
// hoof, horn, or jaws Strike (your choice) that uses the target's unarmed Strike statistics except that the damage type changes to bludgeoning,
// piercing, or slashing, as appropriate. Whenever the target attempts to use any manipulate action, it must succeed at a @Check[flat|dc:5] or the
// action is lost." (with PF2e's Effect) / "As failure, but the duration is unlimited." (with its Effect): Clumsy 1 for the row's time, PF2e's
// Effects for the weakness (bound by their durations), the Strike and the flat check notes.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const EFFECT = /^@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}$/;
const SUCCESS = new RegExp(String.raw`^The target's body gains minor [a-z]+ features\. Its insides churn as they partially transform, causing it to be (${C}Clumsy (\d)\}) for 1 round\. When it recovers from the clumsy condition, its features revert to normal, and the spell ends\.$`);
const FAILURE = /^The target transforms into a [a-z]+ form for (\d+) (hour|minute)s?\. The target becomes clumsy (\d) and gains weakness (\d+) to ([a-z]+)\. (It gains a claw, hoof, horn, or jaws Strike \(your choice\) that uses the target's unarmed Strike statistics except that the damage type changes to bludgeoning, piercing, or slashing, as appropriate\.) (Whenever the target attempts to use any manipulate action, it must succeed at a @Check\[flat\|dc:5\] or the action is lost\.)$/;
const CRITICAL = /^As failure, but the duration is unlimited\.$/;

/** {html, weakness, strike, flat, length, sentences} or null. */
export function rewriteBestialRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr/i.test(html)) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 7 || /\d|@/.test(htmlToPlainText(paragraphs[0]).replace(/Fortitude save/, ""))) return null;
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure"));
    if (!/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !CRITICAL.test(htmlToPlainText(row("Critical Failure")))
        || !EFFECT.test(paragraphs[4]) || !EFFECT.test(paragraphs[6]) || failure[3] !== success[2]) return null;
    const clumsy = success[1];
    return {
        html: `<p>The target must attempt a ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save.</p>`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${clumsy} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target is ${clumsy} for ${failure[1]} ${failure[2]}${failure[1] === "1" ? "" : "s"} and gains weakness ${failure[4]} to ${failure[5]}.</p><p>${paragraphs[4]}</p>`
            + `<p><strong>Critical Failure</strong> The target is ${clumsy} and gains weakness ${failure[4]} to ${failure[5]}.</p><p>${paragraphs[6]}</p>`,
        weakness: { type: failure[5], value: Number(failure[4]) },
        strike: htmlToPlainText(failure[6]),
        flat: htmlToPlainText(failure[7]).replace(/@Check\[flat\|dc:5\]/, "DC 5 flat check"),
        length: { value: Number(failure[1]), unit: `${failure[2]}s` },
        sentences: [htmlToPlainText(paragraphs[0]), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
