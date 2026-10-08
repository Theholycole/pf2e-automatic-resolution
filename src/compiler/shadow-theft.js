// A stolen shadow throttled on each Sustain (Steal Shadow): "You steal a creature's shadow, leaving it weakened and vulnerable. The target must attempt
// a Fortitude save." with rows "The target is unaffected." / "The target is @UUID[…]{Enfeebled 1} for 1 round." / "The target takes
// @Damage[3d4[void]] damage and is @UUID[…]{Enfeebled 1} for the spell's duration as you tear its shadow away, collecting it in your hand. On
// subsequent rounds, the first time each round you @UUID[…]{Sustain the Spell}, you can throttle the shadow to deal @Damage[3d4[void]] damage to
// the target (basic Fortitude save). Until the spell ends, the target doesn't cast a shadow." / "As failure, but the target is @UUID[…]{Enfeebled 2}."
// and "Heightened (+1) The damage when the spell is cast and when it is sustained increases by @Damage[1d4[void]].": the rows with the failing
// rows' damage as PF2e's item damage; on the first Sustain of each later round, a basic save card for each target that failed (the same damage
// at the cast rank); the missing shadow a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, MUST_ATTEMPT_SAVE_LEAD as LEAD, NARRATION_RULES } from "./text-patterns.js";

const SUCCESS = new RegExp(String.raw`^The target is (${C}[A-Z][a-z]+ \d\}) for 1 round\.$`);
const FAILURE = new RegExp(String.raw`^The target takes @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage and is (${C}([A-Z][a-z]+) (\d)\}) for the spell's duration as [^.@]+\. On subsequent rounds, the first time each round you @UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Sustain the Spell\}, you can throttle the [a-z]+ to deal @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage to the target \(basic (Fortitude|Reflex|Will) save\)\. (Until the spell ends, the target doesn't cast a shadow\.)$`);
const CRITICAL = new RegExp(String.raw`^As failure, but the target is (${C}([A-Z][a-z]+) (\d)\})\.$`);
const STEP = /^Heightened \(\+1\) The damage when the spell is cast and when it is sustained increases by @Damage\[(\d+d\d+)\[([a-z]+)\]\]\.$/;

/** {html, strike, reminder, sentences} or null. */
export function rewriteShadowTheft(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = LEAD.exec(htmlToPlainText(body).replace(/\s+/g, " ").trim());
    if (!lead || NARRATION_RULES.test(lead[1]) || lead[2].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The target is unaffected." || !success || !failure || !critical || !step) return null;
    const [, formula, type, enfeebled, slug] = failure;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || failure[6] !== formula || failure[7] !== type || failure[8] !== lead[2] || critical[2] !== slug || step[2] !== type) return null;
    return {
        html: `<p>${lead[1]} The target takes ${formula} ${type} damage and must attempt a ${lead[2]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${success[1]} for 1 round.</p>`
            + `<p><strong>Failure</strong> The target takes full damage and is ${enfeebled} for the spell's duration.</p>`
            + `<p><strong>Critical Failure</strong> The target takes full damage and is ${critical[1]} for the spell's duration.</p>`
            + `<hr /><p><strong>Heightened (+1)</strong> The damage increases by ${step[1]}.</p>`,
        strike: { degrees: ["failure", "criticalFailure"], statistic: failure[8].toLowerCase(), label: "Throttle the shadow",
            sourceText: htmlToPlainText(row("Failure")).replace(/\s+/g, " ").trim().split(/(?<=\.)\s+(?=On subsequent)/)[1].split(/(?<=\))\.\s+/)[0] + "." },
        reminder: { kind: "spell-note", text: failure[9], sourceText: failure[9] },
        sentences: [htmlToPlainText(body).replace(/\s+/g, " ").trim(), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => `${h} ${htmlToPlainText(row(h)).replace(/\s+/g, " ").trim()}`), htmlToPlainText(heightened).trim(), failure[9]]
    };
}
