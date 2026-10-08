// A cage of solid air that cuts its prisoner when it breaks (Skyglass Prison): "The air around the target solidifies like glass, trapping the creature
// in a cage that perfectly encases them, making movement nearly impossible." / "A creature targeted with this spell must attempt a Fortitude save." /
// "The cage has AC 10, Hardness 5, and 30 Hit Points, and it's immune to critical hits and precision damage." / "When a creature Escapes or the cage
// is destroyed, shards of hardened air cut the target creature, dealing 3d4 slashing damage." / "You can Dismiss this spell to destroy the cage."
// with rows "The target is @UUID[…]{Immobilized} until it Escapes or until the cage is destroyed. The cage is automatically destroyed at the start
// of your next turn." / "… immobilized until it Escapes or until the cage is destroyed." / "… @UUID[…]{Restrained} until it Escapes or until the cage
// is destroyed." and "Heightened (+1) The cage's Hit Points increase by 10, and the slashing damage increases by 1d4.": the rows' conditions until
// the creature Escapes (at the spell DC), the success's until the start of the caster's next turn; on each held row a note whose control deals the
// shards (PF2e's item damage at the cast rank) when the creature Escapes or the cage is destroyed (or Dismissed), ending the cage; the cage's
// statistics a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_LINK_START as C, NARRATION_RULES } from "./text-patterns.js";

const SAVE = /^A creature targeted with this spell must attempt an? (Fortitude|Reflex|Will) save\.$/;
const CAGE = /^The cage has AC (\d+), Hardness (\d+), and (\d+) Hit Points, and it's immune to critical hits and precision damage\.$/;
const SHARDS = /^When a creature Escapes or the cage is destroyed, shards of [a-z ]+ cut the target creature, dealing (\d+)d(\d+) ([a-z]+) damage\.$/;
const DISMISS = /^You can Dismiss this spell to destroy the cage\.$/;
const SUCCESS = new RegExp(String.raw`^The target is (${C}Immobilized\}) until it Escapes or until the cage is destroyed\. The cage is automatically destroyed at the start of your next turn\.$`);
const FAILURE = /^The target is immobilized until it Escapes or until the cage is destroyed\.$/;
const CRITICAL = new RegExp(String.raw`^The target is (${C}Restrained\}) until it Escapes or until the cage is destroyed\.$`);
const STEP = /^Heightened \(\+(\d)\) The cage's Hit Points increase by (\d+), and the ([a-z]+) damage increases by (\d+)d(\d+)\.$/;

/** {html, shards, reminder, sentences} or null. */
export function rewriteGlassCage(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area) return null;
    const components = adapted.damageComponents ?? [];
    const [body, table, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!table || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const save = SAVE.exec(sentences[1] ?? ""), cage = CAGE.exec(sentences[2] ?? ""), shards = SHARDS.exec(sentences[3] ?? "");
    if (sentences.length !== 5 || NARRATION_RULES.test(sentences[0]) || !save || !cage || !shards || !DISMISS.test(sentences[4]) || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = [...table.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const row = heading => rows.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), critical = CRITICAL.exec(row("Critical Failure")), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (rows.length !== 4 || htmlToPlainText(row("Critical Success")).trim() !== "The target is unaffected." || !success || !FAILURE.test(htmlToPlainText(row("Failure")).trim()) || !critical || !step) return null;
    const [, dice, die, type] = shards;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== `${dice}d${die}` || String(components[0].type).toLowerCase() !== type
        || step[3] !== type || step[5] !== die) return null;
    const baseRank = Number(adapted.rank) || 1;
    return {
        html: `<p>${sentences[0]} The target must attempt a ${save[1]} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p>`
            + `<p><strong>Success</strong> The target is ${success[1]} until the start of your next turn or until it Escapes.</p>`
            + `<p><strong>Failure</strong> The target is ${success[1]} until it Escapes.</p><p><strong>Critical Failure</strong> The target is ${critical[1]} until it Escapes.</p>`,
        shards: { label: "Cage of solid air", text: `${sentences[3]} (Use the control when it Escapes, the cage is destroyed or you Dismiss the spell; the cage ends.)`, sourceText: sentences[3],
            triggeredDamage: { trigger: "cage-broken", dice: Number(dice), die: Number(die), type, componentId: components[0].id, frequency: "once", endsSpell: true, baseRank,
                heightening: { interval: Number(step[1]), dice: Number(step[4]) } } },
        reminder: { kind: "spell-note", text: `${sentences[2].replace(/(\d+) Hit Points/, `$1 Hit Points (+${step[2]} for each rank above ${baseRank})`)} ${sentences[4]} A success's cage is destroyed at the start of your next turn (use the control then).`,
            sourceText: sentences[2] },
        sentences: [...sentences, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(h => `${h} ${htmlToPlainText(row(h)).replace(/\s+/g, " ").trim()}`), htmlToPlainText(heightened).trim()]
    };
}
