// A reprimand whose animals choke the liar (Censure Falsehoods): "You call on your patron to reprimand a creature that has attempted a Deception or
// Stealth check against you or an ally within the past month. You must be aware they did so. Whenever the target speaks, toads and serpents fall from
// their lips. The target attempts a Fortitude saving throw. The spell lasts as long as the target remains sickened by it." with rows "A few animals
// fall from their lips, but they're otherwise unaffected." / "The target is @UUID[…]{Sickened 1}." / "The target is @UUID[…]{Sickened 2} and if
// they perform an action that has the auditory trait or attempt to Cast a Spell, they must succeed at a @Check[flat|dc:5], or the action is
// disrupted as they choke on an animal." / "As failure, and if the target attempts a Deception or Stealth check, their sickened value increases by 1
// (to a maximum of @UUID[…]{Sickened 4}).": the rows' Sickened (the spell lasting while it does); the flat check a note while the creature is
// sickened; the critical failure's increase the GM's control (the module raises the value, to the stated maximum); who may be targeted a note.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const WHO = /^You call on your patron to reprimand a creature that has attempted a ([A-Z][a-z]+) or ([A-Z][a-z]+) check against you or an ally within the past month\.$/;
const AWARE = /^You must be aware they did so\.$/;
const SAVE = /^The target attempts an? (Fortitude|Reflex|Will) saving throw\.$/;
const LASTS = /^The spell lasts as long as the target remains sickened by it\.$/;
const SUCCESS = new RegExp(String.raw`^The target is (${C}Sickened (\d)\})\.$`);
const FAILURE = new RegExp(String.raw`^The target is (${C}Sickened (\d)\}) and (if they perform an action that has the auditory trait or attempt to Cast a Spell, they must succeed at a @Check\[flat\|dc:5\], or the action is disrupted [^.]+)\.$`);
const CRITICAL = new RegExp(String.raw`^As failure, and if the target attempts a ([A-Z][a-z]+) or ([A-Z][a-z]+) check, their sickened value increases by 1 \(to a maximum of ${C}Sickened (\d)\}\)\.$`);

/** {html, flat, increase, who, sentences} or null. */
export function rewriteCensureRows(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const who = WHO.exec(lead[0] ?? ""), save = SAVE.exec(lead[3] ?? "");
    if (lead.length !== 5 || !who || !AWARE.test(lead[1]) || /\d|@/.test(lead[2]) || !save || save[1].toLowerCase() !== adapted.defense.statistic || !LASTS.test(lead[4])) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure")), critical = CRITICAL.exec(row("Critical Failure"));
    if (rows.length !== 4 || !/^A few animals fall from their lips, but they're otherwise unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || !critical
        || critical[1] !== who[1] || critical[2] !== who[2] || Number(critical[3]) <= Number(failure[2])) return null;
    const flat = htmlToPlainText(failure[3]).replace(/@Check\[flat\|dc:5\]/, "DC 5 flat check").replace(/^if they/, "If it");
    return {
        html: `<p>The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> The target is ${success[1]}.</p>`
            + `<p><strong>Failure</strong> The target is ${failure[1]}.</p><p><strong>Critical Failure</strong> The target is ${failure[1]}.</p>`,
        flat: `${flat[0].toUpperCase()}${flat.slice(1)}.`,
        increase: { slug: "sickened", maximum: Number(critical[3]), trigger: `attempted a ${critical[1]} or ${critical[2]} check` },
        who: `Only a creature that attempted a ${who[1]} or ${who[2]} check against the caster or an ally within the past month, which the caster is aware of, can be targeted.`,
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
