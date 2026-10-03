// The caster moves, and a blast goes off where they left or landed (Echo Jump, Blazing Dive; user decision: the caster's movement is a
// reminder, as Mercurial Stride's):
//   Echo Jump — "You teleport to an unoccupied space within range, leaving behind a faint echo of your form that explodes with magical
//   force." / "Each creature within a 10-foot emanation from your previous location takes 4d8 force damage." with "Heightened (+2) The range
//   increases by 10 feet, and the damage increases by 3d8.";
//   Blazing Dive — "You Fly 15 feet straight up into the air, then Fly in a straight line to an empty space of your choice on the ground within
//   60 feet." / "When you land, blistering air blasts out from you, dealing 3d4 bludgeoning damage and 3d6 fire damage (basic Reflex save) to
//   all creatures in a 10-foot emanation." with "Heightened (+1) The damage increases by 1d4 bludgeoning and 1d6 fire."
// Rewritten to the ordinary basic save of the creatures in the area (the item's damage, its own heightening); the move, with the range at
// the cast rank, is the caster's reminder: move the token, place the emanation where the text puts it and target the creatures in it.
import { htmlToPlainText } from "./description-parser.js";

const TELEPORT = /^You teleport to an unoccupied space within range, leaving behind [a-z ,']+\.$/;
const FROM_PREVIOUS = /^Each creature within an? (\d+)-foot emanation from your previous location takes ((?:\d+d\d+ [a-z]+ damage)(?: and \d+d\d+ [a-z]+ damage)?)\.$/;
const FLY_DIVE = /^You Fly (\d+) feet straight up into the air, then Fly in a straight line to an empty space of your choice on the ground within (\d+) feet\.$/;
const ON_LANDING = /^When you land, [a-z ,']+, dealing ((?:\d+d\d+ [a-z]+ damage)(?: and \d+d\d+ [a-z]+ damage)?) \(basic (Fortitude|Reflex|Will) save\) to all creatures in an? (\d+)-foot emanation\.$/;
const RANGE_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The range increases by (\d+) feet, and the damage increases by ([^<]+?)\.\s*<\/p>$/;
const DAMAGE_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by ([^<]+?)\.\s*<\/p>$/;

/** The stated damage, the item's damage entries in order. */
function damageMatches(text, components) {
    const parts = [...text.matchAll(/(\d+d\d+) ([a-z]+) damage/g)];
    return parts.length === components.length && parts.every((part, index) => !components[index].category
        && String(components[index].formula).replace(/\s+/g, "") === part[1] && String(components[index].type).toLowerCase() === part[2]);
}

/** {html, reminder, sentences} or null. */
export function extractMoveBlast(adapted) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || String(adapted.targeting?.target ?? "").trim() || area?.type !== "emanation") return null;
    if (String(adapted.lifecycle?.duration ?? "").trim() || adapted.lifecycle?.sustained) return null;
    const components = adapted.damageComponents ?? [];
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1 || !components.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const narration = sentences.length === 3 && !/\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until)\b/i.test(sentences[0]);
    const [move, blast] = sentences.slice(narration ? 1 : 0);
    if (sentences.length !== (narration ? 3 : 2)) return null;
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    let damage, feet, reminder, step = null;
    const teleport = TELEPORT.test(move) ? FROM_PREVIOUS.exec(blast) : null;
    const dive = FLY_DIVE.exec(move), landing = dive ? ON_LANDING.exec(blast) : null;
    if (teleport && range) {
        [damage, feet] = [teleport[2], Number(teleport[1])];
        const heightened = RANGE_STEP.exec(rest[0]);
        if (!heightened) return null;
        step = { interval: Number(heightened[1]), damage: heightened[3] };
        reminder = { kind: "caster-movement", text: `Teleport the caster to an unoccupied space within {feet} feet. The ${feet}-foot emanation is centred on the space the caster left: target the creatures in it.`,
            rankFeet: { base: Number(range[1]), step: Number(heightened[2]), interval: step.interval, baseRank: Number(adapted.rank) }, sourceText: move };
    } else if (landing && landing[2].toLowerCase() === adapted.defense.statistic) {
        [damage, feet] = [landing[1], Number(landing[3])];
        const heightened = DAMAGE_STEP.exec(rest[0]);
        if (!heightened) return null;
        step = { interval: Number(heightened[1]), damage: heightened[2] };
        reminder = { kind: "caster-movement", text: `The caster Flies ${dive[1]} feet straight up, then in a straight line to an empty space on the ground within ${dive[2]} feet: move the token. The ${feet}-foot emanation is centred on where the caster lands: target the creatures in it.`, sourceText: move };
    } else return null;
    if (feet !== Number(area.value) || !damageMatches(damage, components)) return null;
    // The Heightened entry's damage must be the item's own (each entry's step, in order).
    const steps = [...step.damage.matchAll(/(\d+d\d+)(?: ([a-z]+))?/g)];
    if (!(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === step.interval && steps.length === components.length
        && steps.every((entry, index) => adapted.heightening.damage?.[components[index].id] === entry[1] && (!entry[2] || entry[2] === String(components[index].type).toLowerCase())))) return null;
    return {
        html: `<p>Each creature in the area takes ${damage} (basic ${adapted.defense.statistic[0].toUpperCase()}${adapted.defense.statistic.slice(1)} save).</p>`
            + `<hr /><p><strong>Heightened (+${step.interval})</strong> The damage increases by ${steps.map(entry => entry[1]).join(" and ")}.</p>`,
        reminder, sentences: [...sentences, htmlToPlainText(rest[0]).trim()]
    };
}
