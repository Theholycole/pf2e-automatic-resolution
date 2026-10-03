// A large thrall that strikes twice and holds (Conglomerate of Limbs): "You conjure forth a humongous thrall consisting solely of undead severed limbs. You create a Huge
// thrall within range. This thrall has 40 Hit Points and a Speed of 25 feet." / "When you use {Thrall Charge} to order this thrall to make a Strike, it makes two melee
// unarmed Strikes instead of one, each against a different creature within 10 feet. Your multiple attack penalty doesn't increase until after the thrall makes both
// Strikes. A creature hit by one of these Strikes must also succeed at a @Check[fortitude|against:spell|…] saving throw or become {Grabbed} by the thrall for 1 round
// (or {Restrained} on a critical failure) or until it Escapes. Attempts to Escape don't automatically succeed, and the Escape DC is your spell DC." with "Heightened
// (+1) The thrall's Hit Points increase by 10." The thrall a token by the thrall rules (the user's, from the thrall trait, 2026-10-03): level −1, mindless undead, the
// stated size, Hit Points and Speed, immune to bleed, death effects, disease, mental and poison, every check of its own a failure, its Strike the caster's spell attack
// for 1d6 (+1d6 at the caster's 5th level and every 4 after); the caster's control for the two Strikes (one multiple attack penalty for both) and each hit's save.
import { htmlToPlainText } from "./description-parser.js";

const SIZES = { Tiny: "tiny", Small: "sm", Medium: "med", Large: "lg", Huge: "huge", Gargantuan: "grg" };
const RULES = [
    [/^You conjure forth [a-z ]+ thrall consisting solely of [a-z ]+\.$/, null],
    [/^You create an? (Tiny|Small|Medium|Large|Huge|Gargantuan) thrall within range\.$/, "size"],
    [/^This thrall has (\d+) Hit Points and a Speed of (\d+) feet\.$/, "stats"],
    [/^When you use (?:@UUID\[[^\]]+\]\{Thrall Charge\}|Thrall Charge) to order this thrall to make a Strike, it makes (two) melee unarmed Strikes instead of one, each against a different creature within (\d+) feet\.$/, "strikes"],
    [/^Your multiple attack penalty doesn't increase until after the thrall makes both Strikes\.$/, "map"],
    [/^A creature hit by one of these Strikes must also succeed at a @Check\[(fortitude|reflex|will)\|against:spell[^\]]*\] saving throw or become (?:@UUID\[[^\]]+\]\{Grabbed\}) by the thrall for (\d+) rounds? \(or (?:@UUID\[[^\]]+\]\{Restrained\}) on a critical failure\) or until it Escapes\.$/, "hold"],
    [/^Attempts to Escape don't automatically succeed, and the Escape DC is your spell DC\.$/, "escape"]
];
const STEP = /^Heightened \(\+(\d)\) The thrall's Hit Points increase by (\d+)\.$/;

/** {giantThrall, claimed} or null. */
export function compileGiantThrall(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !(adapted.activation?.traits ?? []).includes("thrall")) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const range = /^(\d+) feet$/.exec(String(adapted.targeting?.range ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (!minutes || !range || rest.length) return null;
    const sentences = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].flatMap(match => match[1].replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const found = {};
    for (const sentence of sentences) {
        const index = RULES.findIndex(([pattern], at) => !found[at] && pattern.test(sentence));
        if (index < 0) return null;
        found[index] = RULES[index][0].exec(sentence);
    }
    const get = key => found[RULES.findIndex(rule => rule[1] === key)];
    const step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (Object.keys(found).length !== RULES.length || !step) return null;
    const [size, stats, strikes, hold] = [get("size"), get("stats"), get("strikes"), get("hold")];
    return { giantThrall: { seconds: Number(minutes[1]) * 60, range: Number(range[1]), size: SIZES[size[1]], hp: Number(stats[1]), speed: Number(stats[2]), hpStep: { every: Number(step[1]), add: Number(step[2]) },
            baseRank: Number(adapted.rank), strikes: 2, reach: Number(strikes[2]), save: hold[1], holdRounds: Number(hold[2]),
            // (The thrall rules: the user's, from the thrall trait.)
            thrall: { level: -1, traits: ["mindless", "undead"], immunities: ["bleed", "death-effects", "disease", "mental", "poison"], strike: { die: 6, types: ["bludgeoning", "piercing", "slashing"], firstStepLevel: 5, every: 4 } } },
        claimed: [...sentences.map(sentence => htmlToPlainText(sentence)), step[0]] };
}
