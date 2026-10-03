// An area that is only difficult terrain (no save, no damage): 500 Toads, Mud Pit, Earthworks, Warped Terrain.
//   "The area is difficult terrain, …" / "The mud is difficult terrain." / "The ground in the area becomes difficult terrain." / "Any creature
//   moving through the illusion treats the squares as difficult terrain." with the size by actions ("The spell's area is a
//   @Template[burst|distance:5] if you spent 1 action …"; "For each additional action you use casting the spell, the burst's radius increases by
//   5 feet, to a maximum of 10 extra feet for 3 actions.") and "Heightened (4th) … difficult terrain for flying creatures".
// Casting places the burst (its radius from the actions spent) and starts a lingering area for the duration with PF2e's difficult terrain on
// its region (walking; flying too from the Heightened rank). Clearing squares, disbelieving, and traps the area triggers are notes.
import { htmlToPlainText } from "./description-parser.js";

const TERRAIN = /^(?:The area is|The ground in the area (?:is|becomes)|The mud is|Any creature moving through the illusion treats the squares as) difficult terrain(?:, and (the magic reconstructs any [a-z ]+ destroyed by traps to keep the area full of [a-z ]+ for the duration of the spell))?\.$/;
const NOTES = [
    /^The vast quantity of [a-z ]+ provides enough weight and height for the creatures to trigger any potential trap in the area that could be triggered by the weight, movement, or position of a Medium creature\.$/,
    /^A creature can Interact to clear the [a-z ]+ from one 5-foot square adjacent to it\.$/,
    /^A creature can attempt to disbelieve the effect as normal after using a (?:@UUID\[[^\]]+\]\{Seek\}|Seek) action or otherwise spending actions interacting with the illusion\.$/,
    /^If it successfully disbelieves, it ignores the effect for the remaining duration\.$/
];
const BY_ACTIONS = /^The spell's area is a @Template\[burst\|distance:(\d+)\] if you spent 1 action to cast it, a @Template\[burst\|distance:(\d+)\] if you spent 2 actions, or a @Template\[burst\|distance:(\d+)\] if you spent 3 actions\.$/;
const PER_ACTION = /^For each additional action you use casting the spell, the burst's radius increases by (\d+) feet, to a maximum of (\d+) extra feet for 3 actions\.$/;
const FLYING = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*[^<]*causing (?:the spell|it) to function as difficult terrain for flying creatures\.?\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|terrain|rounds?|minutes?)\b/i;

/** Returns {terrainArea, claimed} or null. */
export function compileTerrainArea(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained) return null;
    const duration = String(adapted.lifecycle?.duration ?? "").trim();
    const seconds = /^1 round$/i.test(duration) ? 6 : Number(/^(\d+) minutes?$/i.exec(duration)?.[1] ?? 0) * 60;
    if (!seconds) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, ...rest] = html.split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length > 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const rawSentences = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let terrain = null, sizes = null, narrated = 0;
    const notes = [], claimed = [];
    for (const [index, sentence] of sentences.entries()) {
        const raw = rawSentences[index] ?? sentence;
        const ground = !terrain ? TERRAIN.exec(sentence) : null;
        if (ground) { terrain = sentence; if (ground[1]) notes.push(`The ${ground[1].replace(/^the /, "")}.`); claimed.push(sentence); continue; }
        const byActions = BY_ACTIONS.exec(raw) ?? BY_ACTIONS.exec(sentence);
        if (byActions && !sizes) { sizes = { 1: Number(byActions[1]), 2: Number(byActions[2]), 3: Number(byActions[3]) }; claimed.push(sentence); continue; }
        const perAction = PER_ACTION.exec(sentence);
        if (perAction && !sizes && adapted.targeting?.area?.type === "burst") {
            const base = Number(adapted.targeting.area.value), step = Number(perAction[1]);
            if (step * 2 !== Number(perAction[2])) return null;
            sizes = { 1: base, 2: base + step, 3: base + 2 * step }; claimed.push(sentence); continue;
        }
        if (NOTES.some(pattern => pattern.test(sentence))) { notes.push(sentence); claimed.push(sentence); continue; }
        if (!terrain && narrated < 2 && !NARRATION_RULES.test(sentence.replace(/\b\d+ (?:foot|feet) deep\b/, ""))) { narrated++; continue; }
        return null;
    }
    if (!terrain) return null;
    const area = adapted.targeting?.area;
    if (!sizes && !(area?.type === "burst" && Number(area.value) > 0)) return null;
    if (sizes && !/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    let flyingFromRank = null;
    if (rest.length) {
        const flying = FLYING.exec(rest[0]);
        if (!flying) return null;
        flyingFromRank = Number(flying[1]);
    }
    return {
        terrainArea: { sizes: sizes ?? null, radius: sizes ? null : Number(area.value), durationSeconds: seconds, endsAt: seconds === 6 ? "caster-turn-start" : null,
            flyingFromRank, notes, sourceText: terrain },
        claimed: [...claimed, ...(rest.length ? [htmlToPlainText(rest[0]).trim()] : [])]
    };
}

/** The burst's radius for the actions spent, and the movement types it slows at a cast rank. */
export function terrainAt(data, { actions = 2, castRank = 1 } = {}) {
    return { radius: data.sizes ? data.sizes[actions] : data.radius, movement: data.flyingFromRank && castRank >= data.flyingFromRank ? ["walk", "fly"] : ["walk"] };
}
