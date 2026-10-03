// A ring of hostile reflections (Mirror Malefactors): "You completely surround a Large or smaller creature in a shimmering ring of illusory mirrors that follows them as
// they move, … if the target has no reflection, like a vampire, they're unaffected by mirror malefactors. As long as the target is surrounded by mirrors, they're
// Frightened 1, and they can't reduce their frightened value." / "When you Cast the Spell, the reflections leap from the mirrors and attack the target, dealing 7d8 mental
// damage with a basic Will save. On subsequent turns, this effect repeats the first time you Sustain the spell that turn. If the target critically succeeds at any Will
// save they attempt against mirror malefactors, the illusory mirrors shatter and the spell ends.": the sustained target's basic save at the cast and on each round's
// first Sustain; Frightened 1 held (its value locked) while the spell lasts; a critical success ends the spell; no reflection or too large a reminder.
import { htmlToPlainText } from "./description-parser.js";

const FIRST = /^You completely surround a (Large|Medium|Huge) or smaller creature in a shimmering ring of illusory mirrors that follows them as they move, even when the creature moves outside the range of the spell\. (These mirrors reflect the target, though if the target has no reflection, like a vampire, they're unaffected by [a-z ]+\.) As long as the target is surrounded by mirrors, they're (Frightened) (\d), and they can't reduce their frightened value\.$/;
const SECOND = /^When you Cast the Spell, the reflections leap from the mirrors and attack the target, dealing (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\. On subsequent turns, this effect repeats the first time you Sustain the spell that turn\. If the target critically succeeds at any \3 save they attempt against [a-z ]+, the illusory mirrors shatter and the spell ends\.$/;

/** {html, reminder, sentences} or null. */
export function rewriteMirrorRing(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim());
    const first = FIRST.exec(paragraphs[0] ?? ""), second = SECOND.exec(paragraphs[1] ?? "");
    if (paragraphs.length !== 2 || !first || !second || second[3].toLowerCase() !== adapted.defense.statistic) return null;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== second[1] || String(components[0].type).toLowerCase() !== second[2]) return null;
    return {
        html: `<p>The reflections attack the target, which takes ${second[1]} ${second[2]} damage immediately and the first time each round you Sustain the Spell, with a basic ${second[3]} save. The target is ${first[3]} ${first[4]} for as long as the effect persists.</p>${heightened ? `<hr />${heightened}` : ""}`,
        reminder: { kind: "spell-note", text: `Only a ${first[1]} or smaller creature can be the target. ${first[2].replace(/^These mirrors reflect the target, though if/, "If")} Its Frightened ${first[4]} can't be reduced while the mirrors last; a critical success on any of its saves shatters them and ends the spell.`, sourceText: paragraphs[0] },
        sentences: paragraphs
    };
}
