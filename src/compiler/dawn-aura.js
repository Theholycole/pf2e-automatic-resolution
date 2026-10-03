// The light of a new dawn (Tomorrow's Dawn): "The golden light of a new dawn and the promise of life beyond death radiates from your body. You radiate bright
// light in a 20-foot radius (and dim light for the next 20 feet) and gain mental resistance 5. Any nindoru fiend or undead that begins its turn adjacent to
// you must attempt a Will save with the following results." with PF2e's Spell Effect, rows "The creature is unaffected and immune to this spell's effects for
// the remainder of the spell's duration." / "… Sickened 1 until the end of its turn." / "The creature is sickened 1. In addition, it becomes Slowed 1 until the
// end of its next turn." / "As failure, but Sickened 2 and the creature remains slowed 1 for the rest of the spell's duration." and "Heightened (6th) You gain
// mental resistance 10. Heightened (8th) You gain mental resistance 15.": a sustained 5-foot emanation around the caster (the caster out of it), saved
// against by each such creature (the GM confirms) as its turn begins; the critical failure's Slowed lasting while the aura does; a critical success immune
// for the minute; the light and resistance PF2e's Effect on the caster.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const BENEFIT = /^(You radiate bright light in a \d+-foot radius \(and dim light for the next \d+ feet\) and gain ([a-z]+) resistance (\d+))\.$/;
const WHO = /^Any (nindoru fiend or undead) that begins its turn adjacent to you must attempt an? (Fortitude|Reflex|Will) save with the following results\.$/;
const LINK = /@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected and immune to this spell's effects for the remainder of the spell's duration\.$/,
    success: new RegExp(String.raw`^The creature is (${C}Sickened 1\}) until the end of its turn\.$`),
    failure: new RegExp(String.raw`^The creature is sickened 1\. In addition, it becomes (${C}Slowed 1\}) until the end of its next turn\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, but (${C}Sickened 2\}) and the creature remains slowed 1 for the rest of the spell's duration\.$`)
};
const STEPS = /^Heightened \((\d)th\) You gain ([a-z]+) resistance (\d+)\. Heightened \((\d)th\) You gain \2 resistance (\d+)\.$/;

/** {html, area, who, benefit, immunity, sentences} or null. */
export function rewriteDawnAura(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || (adapted.damageComponents ?? []).length) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || sections.length !== 3) return null;
    const [body, table, heightened] = sections;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const benefit = BENEFIT.exec(sentences[1] ?? ""), who = WHO.exec(sentences[2] ?? "");
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const found = { criticalSuccess: ROWS.criticalSuccess.exec(htmlToPlainText(row("Critical Success")).trim()), success: ROWS.success.exec(row("Success")), failure: ROWS.failure.exec(row("Failure")),
        criticalFailure: ROWS.criticalFailure.exec(row("Critical Failure")) };
    const link = LINK.exec(body)?.[0];
    const steps = STEPS.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !benefit || !who || !link || !LINK.test(sentences[3]) || Object.values(found).some(match => !match) || !steps
        || who[2].toLowerCase() !== adapted.defense.statistic || steps[2] !== benefit[2]) return null;
    const sickened = found.success[1], slowed = found.failure[1];
    return {
        html: `<p>${sentences[0]} A creature that starts its turn in the area must attempt a ${who[2]} save.</p><p>${link}</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature is ${sickened} until the end of its turn.</p><p><strong>Failure</strong> The creature is ${sickened} and ${slowed} until the end of its next turn.</p>`
            + `<p><strong>Critical Failure</strong> The creature is ${found.criticalFailure[1]}. It is ${slowed} by the area.</p>`,
        area: { type: "emanation", value: 5 },
        who: { kind: "gm-confirmed", question: `Is this creature a ${who[1]}? Only such a creature is affected.`, sourceText: sentences[2] },
        benefit: `${benefit[1]} (${steps[3]} at ${steps[1]}th rank, ${steps[5]} at ${steps[4]}th rank) for ${minutes[1]} minute${minutes[1] === "1" ? "" : "s"}.`,
        immunity: { degrees: ["criticalSuccess"], duration: { value: Number(minutes[1]), unit: "minutes" }, sourceText: `Critical Success ${htmlToPlainText(row("Critical Success")).trim()}` },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => `${h} ${htmlToPlainText(row(h)).trim()}`), htmlToPlainText(heightened).trim()]
    };
}
