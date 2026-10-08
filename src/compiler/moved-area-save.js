// An area that strikes when cast and again wherever the caster moves it on Sustain (Ancestral Winds):
//   "… Living creatures in the area take 5d6 void damage and 1d6 mental damage and must attempt a Will save. Nonliving creatures are immune to this
//   spell's effects." with rows ("Success … half damage and is @UUID[…]{Frightened 1}." / "Failure … full damage and is @UUID[…]{Frightened 2}." /
//   "Critical Failure As failure, but the creature takes double damage and is @UUID[…]{Stunned 1}.") and after them "The first time each round you
//   Sustain the spell, you can move the area up to 30 feet within the range of the spell. Living creatures in the new area must attempt saves with
//   the same effects as above."
// The lingering area exposed when cast and on that Sustain (living creatures only); moving it is the GM's (a note).
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, DEGREE_LABEL_PAIRS as DEGREES, NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const TAKES = /^Living creatures in the area take (.+) and must attempt an? (Fortitude|Reflex|Will) save\.$/;
const IMMUNE = /^Nonliving creatures are immune to this spell's effects\.$/;
const DAMAGE_PART = /^(\d+d\d+) ([a-z]+) damage$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: new RegExp(String.raw`^The creature takes half damage and is (${C}[A-Z][a-z]+(?: \d)?\})\.$`),
    failure: new RegExp(String.raw`^The creature takes full damage and is (${C}[A-Z][a-z]+(?: \d)?\})\.$`),
    criticalFailure: new RegExp(String.raw`^As failure, but the creature takes double damage and is (${C}[A-Z][a-z]+(?: \d)?\})\.$`)
};
const MOVE = /^The first time each round you Sustain the spell, you can move the area up to (\d+) feet within the range of the spell\. Living creatures in the new area must attempt saves with the same effects as above\.$/;

// Invoke Spirits: "They deal 2d4 mental damage and 2d4 void damage to each living creature in the area, with a basic Will save." / "Additionally,
// creatures that critically fail the save are @UUID[…]{Frightened 2} and are @UUID[…]{Fleeing} for 1 round." / "On subsequent rounds, the first
// time you Sustain the Spell each round, you can move the area up to 30 feet within the range of the spell. Living creatures in the new area must
// attempt saves with the same effects as above, except that critically failing doesn't make them flee.": the basic save's rows with the
// critical failure's conditions; the Sustain's exposures drop Fleeing.
const BASIC_DEAL = /^They deal (.+) to each living creature in the area, with a basic (Fortitude|Reflex|Will) save\.$/;
const CRIT_RIDER = new RegExp(String.raw`^Additionally, creatures that critically fail the save are (${C}[A-Z][a-z]+(?: \d)?\}) and are (${C}(Fleeing)\}) for 1 round\.$`);
const MOVE_EXCEPT = /^On subsequent rounds, the first time you Sustain the Spell each round, you can move the area up to (\d+) feet within the range of the spell\. Living creatures in the new area must attempt saves with the same effects as above, except that critically failing doesn't make them flee\.$/;

function rewriteMovedBasicSave(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const lead = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== 3 || NARRATION_RULES.test(lead[0])) return null;
    const deal = BASIC_DEAL.exec(lead[1]), rider = CRIT_RIDER.exec(lead[2]), move = MOVE_EXCEPT.exec(paragraphs[1]);
    if (!deal || !rider || !move || deal[2].toLowerCase() !== adapted.defense.statistic) return null;
    const parts = deal[1].split(/ and /).map(part => DAMAGE_PART.exec(part.trim()));
    if (!parts.length || parts.some(part => !part) || parts.length !== components.length || components.some(component => component.category)
        || !parts.every(part => components.some(component => String(component.formula).replace(/\s+/g, "") === part[1] && String(component.type).toLowerCase() === part[2]))) return null;
    // (The conditions as the description links them: the raw paragraph's own links.)
    const raw = /<p>([\s\S]*?)<\/p>/i.exec(body)?.[1] ?? "";
    const links = [...raw.matchAll(/@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[^}]+\}/g)].map(match => match[0]);
    if (links.length !== 2) return null;
    return {
        html: `<p>When you Cast the Spell and the first time you Sustain it each round, each living creature in the area must attempt a ${deal[2]} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage, is ${links[0]}, and is ${links[1]} for 1 round.</p>${heightened ? `<hr />${heightened}` : ""}`,
        notes: [`The first time each round you Sustain the spell, you can move the area up to ${move[1]} feet within range (move the region); the living creatures in the new area save, and critically failing doesn't make them flee.`],
        sustainDrops: { criticalFailure: [rider[3].toLowerCase()], sourceText: paragraphs[1] },
        claimed: [...lead, paragraphs[1]]
    };
}

/** {html, notes, claimed} or null. */
export function rewriteMovedAreaSave(adapted) {
    const basic = rewriteMovedBasicSave(adapted);
    if (basic) return basic;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.lifecycle?.sustained !== true || !adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const lead = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = lead.findIndex(sentence => TAKES.test(sentence));
    if (at < 0 || lead.length !== at + 2 || !IMMUNE.test(lead[at + 1]) || lead.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const [, damage, statistic] = TAKES.exec(lead[at]);
    if (statistic.toLowerCase() !== adapted.defense.statistic) return null;
    const parts = damage.split(/ and /).map(part => DAMAGE_PART.exec(part.trim()));
    if (!parts.length || parts.some(part => !part) || parts.length !== components.length || components.some(component => component.category)
        || !parts.every(part => components.some(component => String(component.formula).replace(/\s+/g, "") === part[1] && String(component.type).toLowerCase() === part[2]))) return null;
    const paragraphs = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const rows = {}, written = [];
    for (const [degree, heading] of DEGREES) {
        const text = paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "") ?? "";
        const match = ROWS[degree].exec(text);
        if (!match) return null;
        rows[degree] = match;
        written.push(`${heading} ${htmlToPlainText(text)}`);
    }
    const moveText = paragraphs.find(p => !/^<strong>/.test(p)) ?? "";
    const move = MOVE.exec(htmlToPlainText(moveText));
    if (!move || paragraphs.length !== 5) return null;
    return {
        html: `<p>When you Cast the Spell and the first time you Sustain it each round, each living creature in the area must attempt a ${statistic} save.</p><hr />`
            + `<p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature takes half damage and is ${rows.success[1]}.</p>`
            + `<p><strong>Failure</strong> The creature takes full damage and is ${rows.failure[1]}.</p><p><strong>Critical Failure</strong> The creature takes double damage and is ${rows.failure[1]} and ${rows.criticalFailure[1]}.</p>`,
        notes: [`The first time each round you Sustain the spell, you can move the area up to ${move[1]} feet within range (move the region); the living creatures in the new area save.`,
            "Nonliving creatures are immune (the card refuses them)."],
        claimed: [...lead, ...written, htmlToPlainText(moveText)]
    };
}
