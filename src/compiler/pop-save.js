// Charges a save leaves, each spent for a basic save around the target (Blister): "You point at a target in range, and its skin grows searing blisters
// filled with caustic fluid." / "The target must attempt a Fortitude save." with rows "The target grows one blister. You can spend a single action,
// which has the concentrate trait, to pop a blister. The target and each creature in a @Template[cone|distance:15] originating from the target takes
// 7d6 acid damage (basic Fortitude save). You choose the direction of the cone, which can't include the target. When no blisters are left, the spell
// ends." / "As success, but the target grows two blisters." / "As success, but the target grows four blisters." and "Heightened (+1) The damage of a
// popped blister increases by 1d6.": the target's save sets the count; after Finalize a card pops one at a time — a basic save of its own for the
// target and the creatures the GM targets in the cone — until none are left or the duration runs out.
import { htmlToPlainText } from "./description-parser.js";

const COUNTS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SAVE = /^The target must attempt an? (Fortitude|Reflex|Will) save\.$/;
const GROWS = /^The target grows (one|two|three|four) ([a-z]+?)s?\.$/;
const POP = /^You can spend a single action, which has the concentrate trait, to pop an? ([a-z]+)\.$/;
const BURST = /^The target and each creature in a @Template\[(cone|emanation|burst)\|distance:(\d+)\] originating from the target takes (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const DIRECTION = /^You choose the direction of the cone, which can't include the target\.$/;
const ENDS = /^When no ([a-z]+)s are left, the spell ends\.$/;
const AS_SUCCESS = /^As success, but the target grows (one|two|three|four) ([a-z]+?)s?\.$/;
const STEP = /^Heightened \(\+1\) The damage of a popped [a-z]+ increases by 1d(\d+)\.$/;

/** {mainHTML, popHTML, popArea, popStatistic, uses, sentences} or null. */
export function extractPopSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const save = SAVE.exec(lead.at(-1) ?? "");
    if (lead.length !== 2 || NARRATION_RULES.test(lead[0]) || !save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    // (The success row's sentences with the template kept: the raw text, its links' text unwrapped only for the condition-free match.)
    const success = row("Success").split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (paragraphs.length !== 4 || !/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || success.length !== 5) return null;
    const grows = GROWS.exec(success[0]), pop = POP.exec(success[1]), burst = BURST.exec(success[2]), ends = ENDS.exec(success[4]);
    const failure = AS_SUCCESS.exec(htmlToPlainText(row("Failure"))), critical = AS_SUCCESS.exec(htmlToPlainText(row("Critical Failure")));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!grows || !pop || !burst || !DIRECTION.test(success[3]) || !ends || pop[1] !== grows[2] || ends[1] !== grows[2]) return null;
    if (!failure || !critical || !step || burst[1] !== "cone" || burst[5].toLowerCase() !== adapted.defense.statistic
        || components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== burst[3] || String(components[0].type).toLowerCase() !== burst[4]
        || !burst[3].endsWith(`d${step[1]}`)) return null;
    return {
        mainHTML: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is unaffected.</p>`
            + `<p><strong>Failure</strong> The target is unaffected.</p><p><strong>Critical Failure</strong> The target is unaffected.</p>`,
        popHTML: `<p>Each creature in the area takes ${burst[3]} ${burst[4]} damage with a basic ${burst[5]} save.</p>${heightened ? `<hr />${heightened}` : ""}`,
        popArea: { type: "cone", value: Number(burst[2]) },
        popStatistic: burst[5].toLowerCase(),
        uses: { success: COUNTS[grows[1]], failure: COUNTS[failure[1]], criticalFailure: COUNTS[critical[1]] },
        noun: grows[2],
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`), htmlToPlainText(heightened).trim()]
    };
}
