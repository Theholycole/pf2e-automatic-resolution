// A spell attack that grabs and crushes (Murderous Vine): "Make a ranged spell attack roll against the target's Fortitude DC. On a success, the creature is
// {Grabbed} and takes 3d6 bludgeoning damage and 2d8 piercing damage. At the end of that creature's turn, if it's still grabbed by the vine, it takes
// @Damage[(floor(@item.level/2))d6[bludgeoning]] damage." / "The vine's Escape DC is equal to your spell DC. A creature can attack the vine and attempt to
// break its grip. The vine's AC is equal to your spell DC, and the vine is destroyed if it takes 20 or more damage. Destroying or escaping from the vines
// ends the spell." — the attack against PF2e's own passive defense (the item's), the item's damage (double on a critical hit) and Grabbed until it Escapes
// at the spell DC; the crush at the end of each of its turns while that Grabbed holds (the text's formula at the cast rank); the vine's statistics and its
// destruction a note with the card's control.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`(@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Grabbed\})`;
const LEAD = /^Make a (?:ranged |melee )?spell attack roll against the target's (Fortitude|Reflex|Will) DC\.$/;
const HIT = new RegExp(String.raw`^On a success, the creature is ${C} and takes (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage\.$`);
const CRUSH = /^At the end of that creature's turn, if it's still grabbed by the ([a-z]+), it takes @Damage\[(\(floor\(@item\.(?:level|rank)\/2\)\)d\d+)\[([a-z]+)\]\] damage\.$/;
const ESCAPE = /^The ([a-z]+)'s Escape DC is equal to your spell DC\.$/;
const NOTES = [/^A creature can attack the [a-z]+ and attempt to break its grip\.$/, /^The [a-z]+'s AC is equal to your spell DC, and the [a-z]+ is destroyed if it takes (\d+) or more damage\.$/,
    /^Destroying or escaping from the [a-z]+ ends the spell\.$/, /^You can Dismiss the spell\.$/];
const STEP = /^Heightened \(\+(\d)\) The initial [a-z]+ and [a-z]+ damage each increase by (\d+d\d+), and the ([a-z]+) damage a creature takes for ending its turn grabbed by the [a-z]+ increases by (\d+d\d+)\.$/;

/** {grabAttack, claimed} or null. */
export function compileGrabAttack(adapted, passive) {
    const components = adapted.damageComponents ?? [];
    // (The attack's defense is PF2e's passive one on the item: "fortitude-dc".)
    if (!/^(fortitude|reflex|will)-dc$/.test(String(passive ?? "")) || adapted.defense?.kind === "save") return null;
    if (!(adapted.activation?.traits ?? []).includes("attack") || components.length !== 2) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = sentences.findIndex(sentence => LEAD.test(sentence));
    if (at < 0 || at > 1 || (at === 1 && /\d|@|\b(?:damage|save|bonus|penalty)\b/i.test(sentences[0]))) return null;
    const hit = HIT.exec(sentences[at + 1] ?? ""), crush = CRUSH.exec(sentences[at + 2] ?? ""), escape = ESCAPE.exec(sentences[at + 3] ?? "");
    const notes = sentences.slice(at + 4);
    if (!hit || !crush || !escape || notes.length !== NOTES.length || NOTES.some((pattern, index) => !pattern.test(notes[index]))) return null;
    const dealt = [[hit[2], hit[3]], [hit[4], hit[5]]];
    if (!dealt.every(([formula, type]) => components.some(component => !component.category && String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type))) return null;
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (!step || step[3] !== crush[3] || Object.values(adapted.heightening?.damage ?? {}).some(dice => dice !== step[2]) || Number(adapted.heightening?.interval) !== Number(step[1])) return null;
    // ("(floor(@item.level/2))d6": at rank 4 that's 2d6, a step of 1d6 every 2 ranks — the Heightened entry's.)
    if (!/d6$/.test(crush[2]) || step[4] !== "1d6" || Number(step[1]) !== 2) return null;
    if (`${LEAD.exec(sentences[at])[1].toLowerCase()}-dc` !== passive) return null;
    return { grabAttack: { defense: LEAD.exec(sentences[at])[1].toLowerCase(), condition: hit[1], seconds: Number(minutes[1]) * 60, noun: crush[1], crush: { formula: crush[2], type: crush[3] },
            breaks: Number(NOTES[1].exec(notes[1])[1]), damage: dealt.map(([formula, type]) => ({ formula, type })) },
        claimed: [...sentences.slice(at), step[0]] };
}
