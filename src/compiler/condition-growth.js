// A condition that grows each turn until scraped off (Coral Scourge): rows "The target is {Clumsy 1}. The target can Interact to scrape the coral growths from
// its body, decreasing the clumsy condition to 0 and ending the spell." / "The target is {Clumsy 2}. Each round at the beginning of its turn, the target
// becomes clumsy 1 or increases its clumsy condition by 1, to a maximum of 4. The target can Interact to scrape …, decreasing the clumsy condition to 0 and
// ending the spell. If the target's clumsy condition caused by coral scourge reaches 4, the growths spread to cover the target's entire body, and the target
// becomes {Paralyzed}." / "As failure, but when the target Interacts to scrape …, it reduces its clumsy condition by 1, instead of decreasing it to 0, and
// decreasing the clumsy condition to 0 doesn't end the spell.": the condition's Effect ends on the target's Interact (the spell with it); a failure's grows by
// the step as each of the target's turns begins, to the maximum, where the further condition is granted for the rest of the spell; a critical failure's
// Interact lowers it by 1 instead, and at 0 the growths stay (the next turn's growth starts again from 1).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_HYPHEN_NAME as C } from "./text-patterns.js";

const IS = new RegExp(String.raw`^The target is ${C}\.$`);
const SCRAPE = /^The target can Interact to ([a-z ]+), decreasing the ([a-z-]+) condition to 0 and ending the spell\.$/;
const GROW = /^Each round at the beginning of its turn, the target becomes ([a-z-]+) 1 or increases its ([a-z-]+) condition by (\d), to a maximum of (\d)\.$/;
const FULL = new RegExp(String.raw`^If the target's ([a-z-]+) condition caused by [a-z' ]+ reaches (\d), [a-z' ,]+, and the target becomes ${C}\.$`);
const REDUCE = /^As failure, but when the target Interacts to ([a-z ]+), it reduces its ([a-z-]+) condition by 1, instead of decreasing it to 0, and decreasing the ([a-z-]+) condition to 0 doesn't end the spell\.$/;

const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
const rawSplit = text => String(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);

/** {html, growth: {failure, criticalFailure}, sentences} or null. */
export function rewriteGrowingCondition(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (rows.length !== 4) return null;
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const preamble = split(body);
    // (The preamble only describes the growths and points at the save.)
    if (!preamble.length || preamble.some(sentence => /\d|@|\b(?:damage|bonus|penalty|immune|Sustain|can't|must)\b/i.test(sentence))) return null;
    if (htmlToPlainText(row("Critical Success")).trim() !== "The target is unaffected.") return null;
    const success = rawSplit(row("Success")), failure = rawSplit(row("Failure")), critical = split(row("Critical Failure"));
    if (success.length !== 2 || failure.length !== 4 || critical.length !== 1) return null;
    const sIs = IS.exec(success[0]), sScrape = SCRAPE.exec(htmlToPlainText(success[1]));
    const fIs = IS.exec(failure[0]), grow = GROW.exec(htmlToPlainText(failure[1])), fScrape = SCRAPE.exec(htmlToPlainText(failure[2])), full = FULL.exec(failure[3].replace(/<\/?em>/g, ""));
    const reduce = REDUCE.exec(critical[0]);
    if (!sIs || !sScrape || !fIs || !grow || !fScrape || !full || !reduce || !sIs[3] || !fIs[3]) return null;
    const slug = sIs[2].toLowerCase();
    if ([fIs[2].toLowerCase(), sScrape[2], grow[1], grow[2], fScrape[2], full[1], reduce[2], reduce[3]].some(name => name !== slug) || sIs[1] !== fIs[1]) return null;
    const maximum = Number(grow[4]);
    if (Number(full[2]) !== maximum || Number(fIs[3]) > maximum || maximum > 4) return null;
    const interact = value => `<p>The target is @UUID[${sIs[1]}]{${sIs[2]} ${value}}. The target can spend an Interact action to end the ${slug} condition.</p>`;
    const growth = { timing: "turn-start", step: Number(grow[3]), maximum, atMaximum: { slug: full[4].toLowerCase(), uuid: full[3], name: full[4] }, sourceText: [htmlToPlainText(failure[1]), htmlToPlainText(failure[3])] };
    return {
        html: `${body}<hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + interact(sIs[3]).replace("<p>", "<p><strong>Success</strong> ") + interact(fIs[3]).replace("<p>", "<p><strong>Failure</strong> ") + interact(fIs[3]).replace("<p>", "<p><strong>Critical Failure</strong> "),
        slug,
        growth: { failure: { ...growth, interact: "end" }, criticalFailure: { ...growth, interact: "reduce", sourceText: [...growth.sourceText, critical[0]] } },
        sentences: [...preamble, ...["Critical Success", "Success", "Failure", "Critical Failure"].flatMap(heading => split(row(heading)))]
    };
}
