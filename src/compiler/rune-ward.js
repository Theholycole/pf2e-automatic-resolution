// Runes that soak the next spell's damage (Spellmaster's Ward): "You create one or more glowing protective runes that revolve around you. For each additional action
// you use when Casting the Spell, increase the number of runes you create by one, to a maximum of three runes for 3 actions." / "When you next take damage from a
// spell, a rune is expended to prevent @Damage[2d6 + (@item.rank - 5)[untyped]] of that spell's damage. If damage from the triggering spell remains, additional
// runes are expended until the damage is completely negated, or until all runes have been spent, whichever comes first." with "Heightened (+1) Each rune prevents
// an additional 1 damage.": the actions spent set the runes (asked when cast); the caster's Effect for the sustained spell; when a spell damages the caster, a
// rune's roll at a time is restored until that damage is gone or the runes are; the spell ends with the last rune.
import { htmlToPlainText } from "./description-parser.js";

const LEAD = /^You create one or more [a-z ]+ runes that revolve around you\.$/;
const COUNT = /^For each additional action you use when Casting the Spell, increase the number of runes you create by one, to a maximum of (three|3) runes for 3 actions\.$/;
const PREVENT = /^When you next take damage from a spell, a rune is expended to prevent @Damage\[(\d+)d(\d+) \+ \(@item\.rank - (\d+)\)\[untyped\]\] of that spell's damage\.$/;
const MORE = /^If damage from the triggering spell remains, additional runes are expended until the damage is completely negated, or until all runes have been spent, whichever comes first\.$/;
const STEP = /^Heightened \(\+1\) Each rune prevents an additional 1 damage\.$/;

/** {runeWard, claimed} or null. */
export function compileRuneWard(adapted) {
    if (adapted.defense?.kind === "save" || !/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const prevent = PREVENT.exec(sentences[2] ?? "");
    if (sentences.length !== 4 || !LEAD.test(sentences[0]) || !COUNT.test(sentences[1]) || !prevent || !MORE.test(sentences[3]) || Number(prevent[3]) !== Number(adapted.rank)
        || !STEP.test(htmlToPlainText(heightened).replace(/\s+/g, " ").trim())) return null;
    return {
        runeWard: { runesByActions: { 1: 1, 2: 2, 3: 3 }, formula: `${prevent[1]}d${prevent[2]} + (@item.rank - ${prevent[3]})`, minutes: Number(minutes[1]) },
        claimed: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
