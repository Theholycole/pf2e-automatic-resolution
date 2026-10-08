// A damage save whose critical failure can behead (Beheading Buzz-Saw): "Each creature in the area takes 5d10 slashing damage and 4d6 persistent bleed damage,
// with a Reflex save." with "Success The creature is unaffected." / "Failure The creature takes full damage." / "Critical Failure The creature takes double
// damage. If the creature has a head, it must succeed at a @Check[fortitude|against:spell|traits:death,incapacitation] save or be decapitated; this kills any
// creature except ones that don't require a head to live. For creatures with multiple heads, this usually kills the creature only if you sever its last head.
// This second save has the death and incapacitation traits." — the rows (no critical success row: unaffected, as success), both damage entries scaled by the
// row; the critical failure's second Fortitude save (death, incapacitation) that kills on a failure, which the GM skips for a creature without a head it needs
// (the card's reminder).
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i;
const TAKES = /^Each creature in the area takes (\d+d\d+) ([a-z]+) damage and (\d+d\d+) persistent ([a-z]+) damage, with an? (Fortitude|Reflex|Will) save\.$/;
const HEAD = /^<p>\s*<strong>\s*Critical Failure\s*<\/strong>\s*The creature takes double damage\. If the creature has a head, it must succeed at a @Check\[(fortitude|reflex|will)\|against:spell\|traits:([a-z,]+)\] save or be decapitated; this kills any creature except ones that don't require a head to live\. For creatures with multiple heads, this usually kills the creature only if you sever its last head\. This second save has the ([a-z]+) and ([a-z]+) traits\.\s*<\/p>$/;
const SUCCESS = /^<p>\s*<strong>\s*Success\s*<\/strong>\s*The creature is unaffected\.\s*<\/p>$/;
const FAILURE = /^<p>\s*<strong>\s*Failure\s*<\/strong>\s*The creature takes full damage\.\s*<\/p>$/;

/** {html, reminder, sentences} or null. */
export function rewriteDecapitationSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || !adapted.targeting?.area) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 4) return null;
    const lead = htmlToPlainText(paragraphs[0]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const takes = TAKES.exec(lead.at(-1) ?? ""), head = HEAD.exec(paragraphs[3]);
    if (!takes || !head || !SUCCESS.test(paragraphs[1]) || !FAILURE.test(paragraphs[2]) || lead.slice(0, -1).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const components = adapted.damageComponents ?? [];
    const plain = components.find(component => !component.category), persistent = components.find(component => component.category === "persistent");
    if (components.length !== 2 || !plain || !persistent || String(plain.formula).replace(/\s+/g, "") !== takes[1] || String(plain.type).toLowerCase() !== takes[2]
        || String(persistent.formula).replace(/\s+/g, "") !== takes[3] || String(persistent.type).toLowerCase() !== takes[4] || takes[5].toLowerCase() !== adapted.defense.statistic) return null;
    const traits = head[2].split(",");
    if (traits.sort().join() !== [head[3], head[4]].sort().join()) return null;
    return {
        html: `<p>${lead.slice(0, -1).join(" ")} Each creature in the area takes ${takes[1]} ${takes[2]} damage and ${takes[3]} persistent ${takes[4]} damage, with a ${takes[5]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p><p><strong>Failure</strong> The creature takes full damage.</p>`
            + `<p><strong>Critical Failure</strong> The creature takes double damage. It must attempt a @Check[${head[1]}|traits:${traits.join(",")}] save; if the target fails, it dies.</p>${heightened ? `<hr />${heightened}` : ""}`,
        reminder: { kind: "spell-note", text: "The critical failure's second save is only for a creature with a head it needs to live (for several heads, only when this is its last): skip it for any other creature.", sourceText: htmlToPlainText(paragraphs[3]).replace(/\s+/g, " ").trim() },
        persistentRows: true,
        sentences: [...lead, ...paragraphs.slice(1).map(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim()), htmlToPlainText(heightened).trim()]
    };
}
