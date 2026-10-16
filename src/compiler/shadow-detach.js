// A creature's shadow detached until it takes it back (Tenebrous Freedom, PF2e 8.6):
//   "You liberate the shadow from a creature within range. When you Cast the Spell and each time you Sustain it, the shadow moves. The target is {Enfeebled 2}
//   and {Clumsy 2} while its shadow is detached, but the target can reattach its shadow by either succeeding at a [[/act grapple dc=spell-dc]] action against
//   your spell DC or performing a 2-action activity with the manipulate trait while the shadow is within reach. The shadow is otherwise intangible. The target
//   attempts a Fortitude save when you first Cast the Spell." with rows "The target is unaffected." / "The shadow breaks free and moves 5 feet in a direction of
//   your choice. Each time you Sustain the spell, the shadow moves another 5 feet." / "As a success, but the shadow moves 10 feet when you Cast or Sustain the
//   Spell." / "As a success, but the shadow moves 15 feet …" and "Heightened (8th) The target is {Enfeebled 3} and {Clumsy 3} while its shadow is detached."
// Rewritten to each row's conditions while the spell lasts or until the target Grapples against the spell DC (the module's Grapple ending); how far the shadow
// moves and the manipulate activity within its reach are the caster's and GM's reminder. PF2e's data doesn't mark the spell sustained, though its text Sustains
// it: the copy is sustained.
import { htmlToPlainText } from "./description-parser.js";

const CONDITION = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+ \d+\}`;
const LEAD = [
    /^You liberate the shadow from a creature within range\.$/,
    /^When you Cast the Spell and each time you Sustain it, the shadow moves\.$/,
    new RegExp(String.raw`^The target is (${CONDITION}) and (${CONDITION}) while its shadow is detached, but the target can reattach its shadow by either succeeding at a \[\[/act grapple dc=spell-dc\]\] action against your spell DC or performing a 2-action activity with the manipulate trait while the shadow is within reach\.$`),
    /^The shadow is otherwise intangible\.$/,
    /^The target attempts a (Fortitude|Reflex|Will) save when you first Cast the Spell\.$/
];
const ROWS = {
    criticalSuccess: /^The target is unaffected\.$/,
    success: /^The shadow breaks free and moves (\d+) feet in a direction of your choice\. Each time you Sustain the spell, the shadow moves another \1 feet\.$/,
    failure: /^As a success, but the shadow moves (\d+) feet when you Cast or Sustain the Spell\.$/,
    criticalFailure: /^As a success, but the shadow moves (\d+) feet when you Cast or Sustain the Spell\.$/
};
const HEADINGS = { criticalSuccess: "Critical Success", success: "Success", failure: "Failure", criticalFailure: "Critical Failure" };
const HEIGHTENED = new RegExp(String.raw`^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*</strong>\s*The target is (${CONDITION}) and (${CONDITION}) while its shadow is detached\.\s*</p>$`);
const sentencesOf = html => htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
const slugValue = link => /\{([A-Za-z]+) (\d+)\}$/.exec(link).slice(1).join(" ").toLowerCase();

/** {html(conditions), heightened: [{minRank, html}], reminder, sentences} or null. */
export function extractShadowDetach(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    if (String(adapted.lifecycle?.duration ?? "").trim() || !/^1 creature that has a shadow$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length > 1) return null;
    const lead = sentencesOf(body);
    if (lead.length !== LEAD.length || !lead.every((sentence, index) => LEAD[index].test(sentence))) return null;
    const [, first, second] = LEAD[2].exec(lead[2]);
    const save = LEAD[4].exec(lead[4])[1];
    if (save.toLowerCase() !== adapted.defense.statistic) return null;
    const feet = {};
    for (const [degree, heading] of Object.entries(HEADINGS)) {
        const text = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*</strong>\s*([\s\S]*?)</p>`).exec(table)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
        const row = ROWS[degree].exec(text);
        if (!row) return null;
        feet[degree] = row[1] ? Number(row[1]) : null;
    }
    if ((table.match(/<p>/g) ?? []).length !== 4) return null;
    const heightened = rest.length ? HEIGHTENED.exec(rest[0]) : null;
    if (rest.length && (!heightened || Number(heightened[1]) <= Number(adapted.rank ?? 1)
        || slugValue(heightened[2]).split(" ")[0] !== slugValue(first).split(" ")[0] || slugValue(heightened[3]).split(" ")[0] !== slugValue(second).split(" ")[0])) return null;
    const rows = (a, b) => `<p>The target must attempt a ${save} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
        + ["success", "failure", "criticalFailure"].map(degree => `<p><strong>${HEADINGS[degree]}</strong> The target is ${a} and ${b} until it Grapples against your spell DC.</p>`).join("");
    return {
        html: rows(first, second),
        heightened: heightened ? [{ minRank: Number(heightened[1]), html: rows(heightened[2], heightened[3]), sourceText: htmlToPlainText(rest[0]).trim() }] : [],
        reminder: { kind: "detached-shadow", text: `The shadow (detached on a success or worse) moves ${feet.success} feet on a success, ${feet.failure} on a failure or ${feet.criticalFailure} on a critical failure, in a direction of your choice, when you Cast and each time you Sustain the spell; it's intangible. The target can also take it back with a 2-action manipulate activity while it's within reach (GM: end its Effect in Ongoing spells).`, sourceText: lead[1] },
        dataNote: "PF2e's data doesn't mark this spell sustained, but its text Sustains it: it's cast as a sustained spell.",
        sentences: [...lead, ...Object.keys(HEADINGS).map(degree => htmlToPlainText(new RegExp(String.raw`<p>\s*<strong>\s*${HEADINGS[degree]}\s*</strong>\s*([\s\S]*?)</p>`).exec(table)[1]).trim())]
    };
}
