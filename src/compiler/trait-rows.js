// A basic save whose degree table applies only to creatures of some traits or a described aversion (Noxious Metals): "This spell forces toxic
// metal to coalesce on the skin or surface of all living creatures in the area, dealing 4d6 poison damage with a basic Fortitude save." / "Any
// creature that has the plant trait, has the wood trait, or has an anathema toward metal, takes the following effects depending on the result of
// that Fortitude save." with rows "The creature suffers no additional effects." / "The creature takes @Damage[1[persistent,poison]] damage and is
// @UUID[…]{Sickened 1} as long as it takes this persistent damage." / "As success, except @Damage[1d4[persistent,poison]] damage and
// @UUID[…]{Sickened 2}." / "As success, except …": two tables — every living creature's basic save, and for those creatures the same with the
// rows' persistent damage and the condition while it lasts. The traits are read from PF2e; the aversion is the GM's answer for the others.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, DEGREE_LABEL_PAIRS as DEGREES } from "./text-patterns.js";

const LEAD = /^This spell forces [a-z ]+ to coalesce on the skin or surface of all living creatures in the area, dealing (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const WHO = /^Any creature that has the ([a-z]+) trait, has the ([a-z]+) trait, or has an anathema toward ([a-z]+), takes the following effects depending on the result of that (Fortitude|Reflex|Will) save\.$/;
const ROW_SUCCESS = new RegExp(String.raw`^The creature takes (@Damage\[[^\]]*\[persistent,([a-z]+)\]\]) damage and is (${C}([A-Z][a-z]+) (\d)\}) as long as it takes this persistent damage\.$`);
const ROW_AS = new RegExp(String.raw`^As success, except (@Damage\[[^\]]*\[persistent,([a-z]+)\]\]) damage and (${C}([A-Z][a-z]+) (\d)\})\.$`);
const NONE = /^The creature suffers no additional effects\.$/;

/** {mainHTML, variantHTML, traits, aversion, question, labels, persistentType, sentences} or null. */
export function extractTraitRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== 2) return null;
    const lead = LEAD.exec(sentences[0]), who = WHO.exec(sentences[1]);
    if (!lead || !who || lead[3] !== who[4] || lead[3].toLowerCase() !== adapted.defense.statistic || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== lead[1] || String(components[0].type).toLowerCase() !== lead[2]) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4) return null;
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    // (The rows with their links, as the description has them.)
    const success = ROW_SUCCESS.exec(row("Success")), failure = ROW_AS.exec(row("Failure")), critical = ROW_AS.exec(row("Critical Failure"));
    if (!NONE.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !critical) return null;
    const persistentType = success[2];
    if (failure[2] !== persistentType || critical[2] !== persistentType || failure[4] !== success[4] || critical[4] !== success[4]) return null;
    const plainRows = `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
        + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage.</p>`;
    const lasting = "as long as it takes this persistent damage";
    const variantRows = `<p><strong>Critical Success</strong> The creature is unaffected.</p>`
        + `<p><strong>Success</strong> The creature takes half damage and ${success[1]} damage and is ${success[3]} ${lasting}.</p>`
        + `<p><strong>Failure</strong> The creature takes full damage and ${failure[1]} damage and is ${failure[3]} ${lasting}.</p>`
        + `<p><strong>Critical Failure</strong> The creature takes double damage and ${critical[1]} damage and is ${critical[3]} ${lasting}.</p>`;
    const lead2 = `<p>Living creatures in the area take ${lead[1]} ${lead[2]} damage and must attempt a ${lead[3]} save.</p>`;
    const tail = heightened ? `<hr />${heightened}` : "";
    const aversion = `${who[3]}-anathema`;
    return {
        mainHTML: `${lead2}<hr />${plainRows}${tail}`,
        variantHTML: `${lead2}<hr />${variantRows}${tail}`,
        traits: [who[1], who[2]],
        aversion,
        question: `Does this creature have an anathema toward ${who[3]}? (It has neither the ${who[1]} nor the ${who[2]} trait.)`,
        labels: { [aversion]: `Anathema toward ${who[3]}`, other: "No such anathema" },
        persistentType,
        sentences: [...sentences, ...DEGREES.map(([, heading]) => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
