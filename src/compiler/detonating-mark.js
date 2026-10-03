// A mark that can be detonated (Ymeri's Mark): "… as long as you're on the same plane as the target, you can sense the direction it's in. The target is
// @UUID[…]{Fatigued} and can't reduce the value of this condition normally." / "You can detonate the mark at any point during its duration by Dismissing
// the spell. The rune explodes in a @Template[emanation|distance:10] centered on the target that deals 5d6 fire damage with a basic Reflex save. You
// choose whether the mark's target is included in the explosion." / "When you cast the spell, the target attempts a Fortitude save to determine how long
// the mark lasts. If the spell's duration elapses, the rune doesn't detonate." with rows "The target is unaffected." / "The duration is 1 minute." / "The
// duration is 1 week." / "The duration is unlimited." and "Heightened (+1) The damage increases by 2d6.": the Fortitude save (PF2e's defense is the
// explosion's Reflex); Fatigued, held, for the row's time; a note whose controls detonate the mark — a basic save card of PF2e's damage at the cast rank
// for the creatures within the emanation, with or without the marked one — ending the spell; the sensed direction and the lapse reminders.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SENSE = /^The mark gives off a heat that only you can sense; as long as you're on the same plane as the target, you can sense the direction it's in\.$/;
const HELD = new RegExp(String.raw`^The target is (${C}([A-Z][a-z]+)\}) and can't reduce the value of this condition normally\.$`);
const DETONATE = /^You can detonate the mark at any point during its duration by Dismissing the spell\.$/;
const EXPLODES = /^The rune explodes in a @Template\[emanation\|distance:(\d+)\] centered on the target that deals (\d+)d(\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const CHOOSE = /^You choose whether the mark's target is included in the explosion\.$/;
const DURATION = /^When you cast the spell, the target attempts an? (Fortitude|Reflex|Will) save to determine how long the mark lasts\.$/;
const LAPSE = /^If the spell's duration elapses, the rune doesn't detonate\.$/;
const ROWS = { success: /^The duration is (\d+) (minute|hour|day|week)s?\.$/, failure: /^The duration is (\d+) (minute|hour|day|week)s?\.$/, criticalFailure: /^The duration is unlimited\.$/ };
const STEP = /^Heightened \(\+(\d)\) The damage increases by (\d)d(\d+)\.$/;

/** {html, defense, held, note, detonation, reminders, sentences} or null. */
export function rewriteDetonatingMark(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 3) return null;
    const split = text => text.split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const [first, second, third] = paragraphs.map(split);
    const held = HELD.exec(first.at(-1) ?? ""), explodes = EXPLODES.exec(second[1] ?? ""), duration = DURATION.exec(htmlToPlainText(third[0] ?? "").trim());
    if (first.length !== 3 || NARRATION_RULES.test(first[0]) || !SENSE.test(htmlToPlainText(first[1]).trim()) || !held || second.length !== 3 || !DETONATE.test(second[0]) || !explodes
        || !CHOOSE.test(second[2]) || third.length !== 2 || !duration || !LAPSE.test(third[1])) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const plain = heading => htmlToPlainText(rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "").replace(/\s+/g, " ").trim();
    const success = ROWS.success.exec(plain("Success")), failure = ROWS.failure.exec(plain("Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || plain("Critical Success") !== "The target is unaffected." || !success || !failure || !ROWS.criticalFailure.test(plain("Critical Failure")) || !step) return null;
    const [, feet, dice, die, type, statistic] = explodes;
    // (PF2e's defense is the explosion's basic save; its one damage entry the explosion's.)
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `${dice}d${die}` || String(components[0].type).toLowerCase() !== type
        || adapted.defense.basic !== true || adapted.defense.statistic !== statistic.toLowerCase() || step[3] !== die) return null;
    const time = ([, value, unit]) => unit === "week" ? `${Number(value) * 7} days` : `${value} ${unit}${value === "1" ? "" : "s"}`;
    return {
        html: `<p>${first[0]} The target must attempt a ${duration[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is ${held[1]} for ${time(success)}.</p><p><strong>Failure</strong> The target is ${held[1]} for ${time(failure)}.</p>`
            + `<p><strong>Critical Failure</strong> The target is ${held[1]}.</p>${heightened ? `<hr />${heightened}` : ""}`,
        defense: { kind: "save", statistic: duration[1].toLowerCase(), basic: false },
        heldSlug: held[2].toLowerCase(),
        note: { label: "Ymeri's mark", text: `${second.join(" ")} (Use a control to detonate it — with or without the marked creature; the spell then ends.)`, sourceText: second.join(" "), claimsRow: true,
            triggeredDamage: { trigger: "detonate", dice: Number(dice), die: Number(die), type, componentId: components[0].id, frequency: "once", endsSpell: true, baseRank: Number(adapted.rank) || 1,
                heightening: { interval: Number(step[1]), dice: Number(step[2]) }, emanation: Number(feet) } },
        detonation: { statistic: statistic.toLowerCase(), componentId: components[0].id, emanation: Number(feet), sourceText: second[1] },
        reminders: [{ kind: "spell-note", text: htmlToPlainText(first[1]).trim(), sourceText: htmlToPlainText(first[1]).trim() }, { kind: "spell-note", text: third[1], sourceText: third[1] }],
        sentences: [...first.map(s => htmlToPlainText(s).trim()), ...second, ...third.map(s => htmlToPlainText(s).trim()), ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => `${h} ${plain(h)}`), htmlToPlainText(heightened).trim(), second.join(" ")]
    };
}
