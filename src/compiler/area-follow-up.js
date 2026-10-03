// A target's basic save followed by a save for every creature around it (Grisly Growths): "The target takes 10d6 piercing damage (basic Fortitude save)
// as the new features erupt." / "This spell has no effect on a target with a mutable anatomy or no limbs, such as an ooze or a protean." / "The
// growths rot rapidly and fall away after 1 round." / "In addition, unless the initial target critically succeeds, creatures within 30 feet of the
// target, including the target, must attempt @Check[will] saves, after which they're temporarily immune to this secondary effect of grisly growths
// for 1 hour." / "This additional effect is a mental and visual effect." with rows Success / Failure / Critical Failure: the target's basic save;
// then, unless it critically succeeded, a card starts the second save for the creatures within that distance of it (its own table, with the
// hour's immunity). Who has a mutable anatomy or no limbs is the GM's (a note).
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|terrain)\b/i;
const TAKES = /^The target takes (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)(?: as [a-z ]+)?\.$/;
const NO_EFFECT = /^This spell has no effect on a target with a mutable anatomy or no limbs, such as an ooze or a protean\.$/;
const ROT = /^The growths rot rapidly and fall away after 1 round\.$/;
const AROUND = /^In addition, unless the initial target critically succeeds, creatures within (\d+) feet of the target, including the target, must attempt @Check\[(fortitude|reflex|will)\] saves, after which they're temporarily immune to this secondary effect of [a-z ]+ for (\d+) (hour|minute)s?\.$/;
const TRAITS = /^This additional effect is a ([a-z]+) and ([a-z]+) effect\.$/;
const ROWS = { success: /^The creature is unaffected\.$/, failure: new RegExp(String.raw`^The creature is (${C}[A-Z][a-z]+(?: \d)?\})\.$`), criticalFailure: new RegExp(String.raw`^The creature is (${C}[A-Z][a-z]+(?: \d)?\})\.$`) };

/** {mainHTML, followHTML, radius, statistic, traits, note, sentences} or null. */
export function extractAreaFollowUp(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = htmlToPlainText(paragraphs[0]).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (first.length !== 4 || second.length !== 2 || NARRATION_RULES.test(first[0]) || !NO_EFFECT.test(first[2]) || !ROT.test(first[3])) return null;
    const takes = TAKES.exec(first[1]), around = AROUND.exec(second[0]), traits = TRAITS.exec(htmlToPlainText(second[1]));
    if (!takes || !around || !traits || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== takes[1]
        || String(components[0].type).toLowerCase() !== takes[2] || takes[3].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    if (rows.length !== 3 || !ROWS.success.test(htmlToPlainText(row("Success"))) || row("Critical Success")) return null;
    const failure = ROWS.failure.exec(row("Failure")), critical = ROWS.criticalFailure.exec(row("Critical Failure"));
    if (!failure || !critical) return null;
    const statistic = around[2][0].toUpperCase() + around[2].slice(1);
    return {
        mainHTML: `<p>The target takes ${takes[1]} ${takes[2]} damage with a basic ${takes[3]} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        followHTML: `<p>Each creature in the area must attempt a ${statistic} save. Afterward, the creature is temporarily immune for ${around[3]} ${around[4]}${around[3] === "1" ? "" : "s"}.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature is ${failure[1]}.</p><p><strong>Critical Failure</strong> The creature is ${critical[1]}.</p>`,
        radius: Number(around[1]),
        statistic: around[2],
        traits: [traits[1], traits[2]],
        note: `${first[2]} ${first[3]}`,
        sentences: [...first.slice(1), htmlToPlainText(second[0]), htmlToPlainText(second[1]), ...["Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
