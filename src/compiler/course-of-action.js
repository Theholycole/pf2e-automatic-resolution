// A daydream luring the target into the caster's chosen course of action (Dreamer's Call): "You create a vivid, illusory daydream drawn from the
// images of the target's dreams. The daydream appears in an unoccupied space in range, and you attempt to draw the target toward it." with rows
// "The target's attention wavers. It becomes @UUID[…]{Fascinated} by the daydream." / "The target is fascinated with the daydream and pursues a
// course of action you choose as its first action after you Cast the Spell: approach the daydream, run away from it (as the @UUID[…]{Fleeing}
// condition), Release what it's holding as an offering, or Drop Prone in obeisance." / "As failure, but the target follows the course of action for
// as many actions as possible for the spell's duration, and does nothing else.": Fascinated for the spell's duration (until the end of the
// target's next turn); on the failing rows the caster's pick on the card — Fleeing, Prone, or a note to approach or Release — and the critical
// failure's every action a note. PF2e's item states the Will save the text leaves implicit.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{`;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const SUCCESS = new RegExp(String.raw`^The target's attention wavers\. It becomes (${C}Fascinated\}) by the ([a-z]+)\.$`);
const FAILURE = new RegExp(String.raw`^The target is fascinated with the ([a-z]+) and pursues a course of action you choose as its first action after you Cast the Spell: approach the \1, run away from it \(as the (${C}Fleeing\}) condition\), Release what it's holding as an offering, or Drop Prone in obeisance\.$`);
const CRITICAL = /^As failure, but the target follows the course of action for as many actions as possible for the spell's duration, and does nothing else\.$/;
const PRONE = "@UUID[Compendium.pf2e.conditionitems.Item.j91X7x0XSomq8d60]{Prone}";

/** {html, values, notes, sentences} or null. */
export function rewriteCourseOfAction(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false || adapted.targeting?.area || (adapted.damageComponents ?? []).length) return null;
    if (!/^until the end of the target's next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 5 || /<hr/i.test(html)) return null;
    const lead = htmlToPlainText(paragraphs[0]).split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    if (lead.length !== 2 || lead.some(sentence => NARRATION_RULES.test(sentence))) return null;
    const row = heading => paragraphs.find(p => new RegExp(String.raw`^<strong>\s*${heading}\s*<\/strong>`).test(p))?.replace(/^<strong>[^<]*<\/strong>\s*/, "").trim() ?? "";
    const success = SUCCESS.exec(row("Success")), failure = FAILURE.exec(row("Failure"));
    if (!/^The target is unaffected\.$/.test(htmlToPlainText(row("Critical Success"))) || !success || !failure || failure[1] !== success[2] || !CRITICAL.test(htmlToPlainText(row("Critical Failure")))) return null;
    const until = "until the end of its next turn";
    const fascinated = `The target is ${success[1]} ${until}.`;
    const options = `${fascinated} The target is ${failure[2]} ${until}. The target is ${PRONE}.`;
    const statistic = adapted.defense.statistic[0].toUpperCase() + adapted.defense.statistic.slice(1);
    return {
        html: `<p>The target must attempt a ${statistic} save.</p><hr /><p><strong>Critical Success</strong> The target is unaffected.</p><p><strong>Success</strong> ${fascinated}</p>`
            + `<p><strong>Failure</strong> ${options}</p><p><strong>Critical Failure</strong> ${options}</p>`,
        values: ["approach", "flee", "release", "prone"],
        notes: { approach: `Its first action after the spell is cast: approach the ${failure[1]}.`, release: "Its first action after the spell is cast: Release what it's holding as an offering.",
            all: "It follows the chosen course of action with as many actions as possible for the spell's duration, and does nothing else." },
        sentences: [...lead, ...["Critical Success", "Success", "Failure", "Critical Failure"].map(heading => `${heading} ${htmlToPlainText(row(heading))}`)]
    };
}
