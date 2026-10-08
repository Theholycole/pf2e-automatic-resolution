// A ward that empowers its caster inside and drains it outside, with Strikes made inside it (Establish Ward): "… While within the area, you can make nature's
// wrath Strikes by commanding plants, wind, rocks, and other natural features to attack enemies. These are melee Strikes that use your spell attack modifier, can
// target any creature within the ward, and deal 3d8 bludgeoning, piercing, or slashing damage." / "Upon Casting the Spell, you can immediately make a single
// nature's wrath Strike. You are {Quickened} while inside the ward, and can use the additional action only to make nature's wrath Strikes. You are {Slowed 1}
// while outside the area." with "Heightened (+2) The area increases by 5 feet, and the Strikes deal an additional 1d8 damage." — the burst around the caster as a
// placed region (Ongoing's area rules: the caster's Quickened inside, Slowed outside); the card's Strikes: the caster's spell attack against a creature in the
// ward (the multiple attack penalty the caster's button), the dice at the cast rank of the physical type picked.
import { htmlToPlainText } from "./description-parser.js";
import { CONDITION_UUID_START as C } from "./text-patterns.js";

const RULES = {
    strikes: /^While within the area, you can make ([a-z' ]+) Strikes by [a-z, ]+ to attack enemies\.$/,
    deal: /^These are (melee|ranged) Strikes that use your spell attack modifier, can target any creature within the ward, and deal (\d+)d(\d+) (bludgeoning, piercing, or slashing) damage\.$/,
    onCast: /^Upon Casting the Spell, you can immediately make a single ([a-z' ]+) Strike\.$/,
    inside: new RegExp(String.raw`^You are ${C}([A-Z][a-z]+)\} while inside the ward, and can use the additional action only to make ([a-z' ]+) Strikes\.$`),
    outside: new RegExp(String.raw`^You are ${C}([A-Z][a-z]+) (\d)\} while outside the area\.$`)
};
const STEP = /^Heightened \(\+(\d)\) The area increases by (\d+) feet, and the Strikes deal an additional (\d+)d(\d+) damage\.$/;

/** {ward, claimed} or null. */
export function compileWard(adapted) {
    const area = adapted.targeting?.area;
    if ((adapted.defense?.kind ?? "none") !== "none" || String(adapted.targeting?.target ?? "").trim() || area?.type !== "burst" || !(Number(area.value) > 0)) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const plain = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const raw = body.replace(/<[^@>]*>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (plain.length !== raw.length) return null;
    const claimed = {};
    for (const [index, sentence] of raw.entries()) {
        const key = Object.keys(RULES).find(name => !claimed[name] && RULES[name].test(sentence));
        if (key) { claimed[key] = RULES[key].exec(sentence); continue; }
        if (index === 0 && !/\d|@|\b(?:damage|save|bonus|penalty|Strikes?)\b/.test(plain[index])) continue;
        return null;
    }
    if (Object.keys(claimed).length !== Object.keys(RULES).length) return null;
    const { strikes, deal, onCast, inside, outside } = claimed;
    if (onCast[1] !== strikes[1] || inside[3] !== strikes[1]) return null;
    const stepText = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = STEP.exec(stepText);
    if (stepText && !step) return null;
    if (step && step[4] !== deal[3]) return null;
    return { ward: { seconds: Number(minutes[1]) * 60, radius: Number(area.value), strike: { name: strikes[1], range: deal[1], dice: Number(deal[2]), faces: Number(deal[3]), types: deal[4].split(/, (?:or )?/) },
            step: step ? { interval: Number(step[1]), feet: Number(step[2]), dice: Number(step[3]) } : null,
            inside: { uuid: inside[1], name: inside[2] }, outside: { uuid: outside[1], name: outside[2], value: Number(outside[3]) } },
        claimed: [...plain, ...(step ? [stepText] : [])] };
}

/** The ward's radius and the Strikes' dice at a cast rank. */
export function wardAt(data, castRank, baseRank) {
    const steps = data.step ? Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.step.interval)) : 0;
    return { radius: data.radius + steps * (data.step?.feet ?? 0), dice: data.strike.dice + steps * (data.step?.dice ?? 0) };
}
