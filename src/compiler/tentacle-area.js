// An area of grabbing tentacles (Black Tentacles): "Make spell attack rolls against the Fortitude DC of each creature in the area. Any creature you succeed against
// is {Grabbed} and takes 3d6 bludgeoning damage. Whenever a creature ends its turn in the area, the tentacles attempt to grab that creature if they haven't already,
// and they deal @Damage[1d6[bludgeoning]] damage to any creature already Grabbed." / "The tentacles' Escape DC is equal to your spell DC. A creature can attack a
// tentacle in an attempt to release its grip. Its AC is equal to your spell DC, and it is destroyed if it takes 12 or more damage. … You can Dismiss the spell." —
// the placed area; at the cast, the caster's spell attack against each creature inside's Fortitude DC (a success: Grabbed by the tentacles and the damage); as a
// creature ends its turn inside, the same attempt if it isn't held, or the held damage if it is; the Escape and the tentacles' grip the card's control.
import { htmlToPlainText } from "./description-parser.js";

const C = String.raw`@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{`;
const RULES = {
    attack: /^Make spell attack rolls against the (Fortitude|Reflex|Will) DC of each creature in the area\.$/,
    capture: new RegExp(String.raw`^Any creature you succeed against is ${C}Grabbed\} and takes (\d+)d(\d+) ([a-z]+) damage\.$`),
    turn: /^Whenever a creature ends its turn in the area, the tentacles attempt to grab that creature if they haven't already, and they deal @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage to any creature already Grabbed\.$/,
    escape: /^The tentacles' Escape DC is equal to your spell DC\.$/
};
const NOTES = [/^A creature can attack a tentacle in an attempt to release its grip\.$/, /^Its AC is equal to your spell DC, and it is destroyed if it takes (\d+) or more damage\.$/,
    /^Even if destroyed, additional tentacles continue to grow in the area until the duration ends\.$/, /^You can Dismiss the spell\.$/];

/** {tentacleArea, claimed} or null. */
export function compileTentacleArea(adapted) {
    const area = adapted.targeting?.area;
    if (!(adapted.activation?.traits ?? []).includes("attack") || String(adapted.targeting?.target ?? "").trim() || area?.type !== "burst") return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    // (A leading "Area …" paragraph restates the area; the rules follow the rule.)
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    const body = sections.length === 2 && /^\s*<p>\s*<strong>Area<\/strong>/.test(sections[0]) ? sections[1] : sections.length === 1 ? sections[0] : null;
    if (!minutes || body == null) return null;
    const sentences = body.replace(/<p>([\s\S]*?)<\/p>/g, "$1 ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const claimed = {}, notes = [];
    for (const [index, sentence] of sentences.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        const plain = htmlToPlainText(sentence);
        if (NOTES.some(pattern => pattern.test(plain))) { notes.push(plain); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty)\b/.test(plain)) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const { attack, capture, turn } = claimed;
    const [entry, ...others] = adapted.damageComponents ?? [];
    if (others.length || !entry || String(entry.formula ?? "").replace(/\s+/g, "") !== `${capture[2]}d${capture[3]}` || entry.type !== capture[4]) return null;
    return { tentacleArea: { seconds: Number(minutes[1]) * 60, defense: attack[1].toLowerCase(), grabbed: capture[1], capture: { formula: `${capture[2]}d${capture[3]}`, type: capture[4] },
            held: { formula: `${turn[1]}d${turn[2]}`, type: turn[3] }, notes },
        claimed: sentences.map(sentence => htmlToPlainText(sentence)) };
}
