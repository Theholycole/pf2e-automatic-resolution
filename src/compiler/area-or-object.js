// A spell cast either on an area or on an object (Grease): "You conjure grease, choosing an area or target." with a list —
//   Area [4 contiguous 5-foot squares]: "All solid ground in the area is covered with grease." / "Each creature standing on the greasy
//   surface must succeed at a Reflex save or an Acrobatics check against your spell DC or fall Prone." / "Creatures using an action to move
//   onto the greasy surface during the spell's duration must attempt either a Reflex save or an Acrobatics check to Balance." / "A creature
//   that Steps or Crawls doesn't have to attempt a check or save."
//   Target [1 object of Bulk 1 or less]: what the object does (checks to pick it up or hold it, a worn object's bonus).
// The area branch is a degree save (user decision): the creatures the caster targets on the surface roll the save, failing into the
// condition; that a creature may use the skill instead, and the moving creatures' check, are reminders. The object branch is the GM's.
import { htmlToPlainText } from "./description-parser.js";

const INTRO = /^<p>\s*You [a-z]+ [a-z ]+, choosing an area or (?:a )?target\.\s*<\/p>\s*$/;
const AREA_ITEM = /^<strong>\s*Area\s*<\/strong>\s*<strong>\s*\[(\d+) contiguous 5-foot squares\]\s*<\/strong>\s*([\s\S]+)$/;
const TARGET_ITEM = /^<strong>\s*Target\s*<\/strong>\s*<strong>\s*\[([^\]]+)\]\s*<\/strong>\s*([\s\S]+)$/;
const COVERED = /^All solid ground in the area is covered with [a-z ]+\.$/;
const SAVE_OR = /^Each creature standing on the [a-z ]+ must succeed at an? (Fortitude|Reflex|Will) save or an? (Acrobatics|Athletics) check against your spell DC or fall (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})\.$/;
const MOVING = /^Creatures using an action to move onto the [a-z ]+ during the spell's duration must attempt either an? (Fortitude|Reflex|Will) save or an? (Acrobatics|Athletics) check to (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Balance\}|Balance)\.$/;
const EXEMPT = /^A creature that Steps or Crawls doesn't have to attempt a check or save\.$/;

/** Returns {html, target, reminders, claimed} or null. */
export function extractAreaOrObject(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic || (adapted.damageComponents ?? []).length || adapted.targeting?.area) return null;
    const html = String(adapted.descriptionHTML ?? "").trim();
    const list = /<ul>([\s\S]*?)<\/ul>\s*$/i.exec(html);
    if (!list || !INTRO.test(html.slice(0, list.index)) || /<strong>\s*Heightened/i.test(html)) return null;
    const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(match => match[1].trim());
    if (items.length !== 2 || list[1].replace(/<li>[\s\S]*?<\/li>/gi, "").trim()) return null;
    const area = AREA_ITEM.exec(items[0]), object = TARGET_ITEM.exec(items[1]);
    if (!area || !object || object[1].trim() !== String(adapted.targeting?.target ?? "").trim()) return null;
    const sentences = htmlToPlainText(area[2]).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (sentences.length !== 4 || !COVERED.test(sentences[0]) || !MOVING.test(sentences[2]) || !EXEMPT.test(sentences[3])) return null;
    const save = SAVE_OR.exec(sentences[1]);
    if (!save || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const moving = MOVING.exec(sentences[2]);
    if (moving[1] !== save[1] || moving[2] !== save[2]) return null;
    const plain = text => text.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1");
    const objectText = plain(htmlToPlainText(object[2]).replace(/\s+/g, " ").trim());
    // The object branch: the checks and penalties it describes are the GM's (no damage, no other condition).
    if (/@Damage|\d+d\d+|conditionitems\./.test(object[2])) return null;
    const statistic = save[1], condition = save[3];
    return {
        html: `<p>Each creature in the area must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p><p><strong>Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Failure</strong> The creature falls ${condition}.</p><p><strong>Critical Failure</strong> The creature falls ${condition}.</p>`,
        target: `${area[1]} contiguous 5-foot squares`,
        reminders: [
            { kind: "save-or-skill", text: `Area (${area[1]} contiguous 5-foot squares): target the creatures standing on it. ${plain(sentences[1])} A creature may use ${save[2]} instead: set its result on the card.`, sourceText: sentences[1] },
            { kind: "surroundings", text: `${sentences[0]} ${plain(sentences[2])} ${sentences[3]} Those later checks are the GM's.`, sourceText: sentences[2] },
            { kind: "object-branch", text: `Or on a target (${object[1].trim()}): ${objectText} The module resolves the area; resolve an object yourself.`, sourceText: objectText }
        ],
        claimed: [htmlToPlainText(html.slice(0, list.index)).trim(), ...sentences, objectText]
    };
}
