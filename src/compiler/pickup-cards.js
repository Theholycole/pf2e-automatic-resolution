// Spells making things creatures pick up and use (feature group 14), as a card of parts:
//   - thrown seeds: "Four acorns grow in your hand …" / "You or anyone else who has one of the acorns can toss it up to 30 feet with an Interact action."
//     / "It explodes in a 5-foot burst, dealing 4d6 fire damage." with the burning ground ("… dealing 2d6 fire damage to any creature that enters the
//     flames or ends its turn within them." once a round across the acorns) and the Heightened damage; the acorns rot when the spell ends;
//   - a tree's seasonal pods: "When thrown, a pod explodes in a 5-foot burst, dealing 6d6 damage with a basic Reflex save against your spell DC." / "The
//     damage type depends on the season of the pod: electricity for spring, fire for summer, poison for autumn, or cold for winter.";
//   - gifts from the sky: "You or an ally in the area can Interact to collect one of these gifts …" with the three benefits a character selects (Hit
//     Points; an affliction's stage; Clumsy, Drained, Enfeebled or Stupefied down by 2, or two of them by 1).
import { WORD_NUMBERS_2_6 as NUMBER, capitalize as Stat, blocks, matchAll, minutes, plain, sentenceSplit as split, unread } from "./text-patterns.js";

// (Fixed Heightened entries: "(ternary(gte(@item.rank,9),6,ternary(gte(@item.rank,8),5,4)))" from the base dice and each entry's.)
// (The highest rank's test outermost: each lower entry nested inside it.)
const fixedDice = (base, entries) => entries.sort((a, b) => a.rank - b.rank).reduce((inner, entry) => `ternary(gte(@item.rank,${entry.rank}),${entry.dice},${inner})`, String(base));

/** {parts, notes, claimed, lasting?} or null. */
export function extractPickupCard(adapted) {
    for (const reader of [seeds, pods, gifts]) { const found = reader(adapted); if (found) return found; }
    return null;
}

function seeds(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.basic !== true) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^([A-Z][a-z]+) ([a-z]+)s grow in your hand, [^.]+\.$/, /^You or anyone else who has one of the [a-z]+s can toss it up to (\d+) feet with an Interact action\.$/,
        /^It explodes in a (\d+)-foot burst, dealing (\d+)d(\d+) ([a-z]+) damage\.$/, /^The save uses your spell DC, even if someone else throws the [a-z]+\.$/,
        /^Flames continue to burn on the ground in the burst for (\d+) minutes?, dealing @Damage\[(\d+)d(\d+)\[([a-z]+)\]\] damage to any creature that enters the flames or ends its turn within them\.$/,
        /^A creature can take damage from the continuing flames only once per round, even if it's in overlapping areas of fire created by different [a-z]+s\.$/,
        /^When the spell ends, any remaining [a-z]+s rot and turn to ordinary soil\.$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found).length) return null;
    const [grow, toss, burst, , flames] = found;
    const count = NUMBER[grow[1].toLowerCase()];
    const heightened = split(plain(parts[1]));
    const entries = [];
    for (const sentence of heightened) {
        const m = /^Heightened \((\d+)th\) The burst's damage increases to (\d+)d(\d+), and the continuing flames damage increases to (?:@Damage\[)?(\d+)d(\d+)(?:\[[a-z]+\]\] damage)?\.$/.exec(sentence);
        if (!m || Number(m[3]) !== Number(burst[3]) || Number(m[5]) !== Number(flames[3])) return null;
        entries.push({ rank: Number(m[1]), burst: Number(m[2]), flames: Number(m[4]) });
    }
    const seconds = minutes(adapted) * 60;
    if (!count || !entries.length || !Number.isFinite(seconds) || burst[4] !== flames[4]) return null;
    const statistic = adapted.defense.statistic;
    const burstFormula = `(${fixedDice(burst[2], entries.map(entry => ({ rank: entry.rank, dice: entry.burst })))})d${burst[3]}[${burst[4]}]`;
    const flameFormula = `(${fixedDice(flames[2], entries.map(entry => ({ rank: entry.rank, dice: entry.flames })))})d${flames[3]}`;
    return {
        parts: [{ key: "throw", title: `Throw ${grow[2] === "acorn" ? "an" : "a"} ${grow[2]}`, kind: "seed", count, item: grow[2], range: Number(toss[1]),
            place: { type: "burst", value: Number(burst[1]) }, spec: { type: "save", statistic, basic: true, area: true, damage: { formula: `${burst[2]}d${burst[3]}`, type: burst[4] }, formula: burstFormula,
                html: `<p>Each creature takes ${burst[2]}d${burst[3]} ${burst[4]} damage (basic ${Stat(statistic)} save).</p>` },
            flames: { formula: flameFormula, type: flames[4], seconds: Number(flames[1]) * 60, events: ["enter", "turn-end"] },
            repeat: { trigger: `another ${grow[2]} is thrown (${count} in all)` },
            reminder: `Place the ${burst[1]}-foot burst where the ${grow[2]} lands (within ${toss[1]} feet of its thrower): the module's save card for the creatures in it (the caster's spell DC), then the burning ground.` }],
        lasting: { seconds, sustained: false },
        // (The acorns themselves: an item on the caster, handed around as the table likes.)
        pickup: { item: grow[2], count, text: `${grow[0]} Anyone holding one can throw it up to ${toss[1]} feet with an Interact action (the spell's card resolves it).` },
        notes: [],
        claimed: [...found.map(match => match[0]), ...heightened]
    };
}

function pods(adapted) {
    const parts = blocks(adapted);
    if (parts.length !== 2 || adapted.defense?.basic !== true) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^You cause a (Small) tree to instantly sprout in an unoccupied space on the ground\.$/, /^(Four) seedpods grow from the tree, each filled with the magic of a different one of the four seasons\.$/,
        /^A creature can Interact to pluck one of the pods, and can then either throw it up to (\d+) feet as part of the same action or do so with a separate Interact action later\.$/,
        /^When thrown, a pod explodes in a @Template\[burst\|distance:(\d+)\], dealing (\d+)d(\d+) damage with a basic (Reflex) save against your spell DC\.$/,
        /^The damage type depends on the season of the pod: ([a-z]+) for spring, ([a-z]+) for summer, ([a-z]+) for autumn, or ([a-z]+) for winter\.$/,
        /^When the spell ends, the tree withers away and any remaining pods rot, leaving behind non-magical seeds\.$/,
        /^(?:@Damage\[\(@item\.level\)d6\[[a-z]+\]\] ?){4}$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found).length) return null;
    const [, , pluck, burst, types] = found;
    const step = /^Heightened \(\+1\) The burst's damage increases by (\d+)d(\d+)\.$/.exec(plain(parts[1]));
    const seconds = minutes(adapted) * 60, rank = Number(adapted.rank), statistic = burst[4].toLowerCase();
    if (!step || Number(step[2]) !== Number(burst[3]) || !Number.isFinite(seconds) || statistic !== adapted.defense.statistic) return null;
    const seasons = ["spring", "summer", "autumn", "winter"];
    return {
        parts: seasons.map((season, index) => ({ key: season, title: `The ${season} pod (${types[index + 1]})`, kind: "pod", place: { type: "burst", value: Number(burst[1]) }, range: Number(pluck[1]),
            spec: { type: "save", statistic, basic: true, area: true, damage: { formula: `${burst[2]}d${burst[3]}`, type: types[index + 1] },
                formula: `(${burst[2]} + ${step[1]} * (@item.rank - ${rank}))d${burst[3]}[${types[index + 1]}]`, html: `<p>Each creature takes ${burst[2]}d${burst[3]} ${types[index + 1]} damage (basic ${Stat(statistic)} save).</p>` },
            reminder: `Place the ${burst[1]}-foot burst where the ${season} pod lands (thrown up to ${pluck[1]} feet): the module's save card for the creatures in it.` })),
        lasting: { seconds, sustained: false },
        notes: ["Place the Small tree in an unoccupied space on the ground within range; creatures pluck its pods by Interacting (who throws doesn't change the save)."],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^(?:Four seedpods|You cause a Small tree)\b/.test(sentence)), plain(parts[1])]
    };
}

function gifts(adapted) {
    const parts = blocks(adapted);
    const html = String(adapted.descriptionHTML ?? "");
    if (parts.length !== 2 || adapted.targeting?.area?.type !== "emanation" || !/<ul>/.test(parts[0])) return null;
    const lead = split(plain(parts[0]));
    const LEAD = [/^You or an ally in the area can Interact to collect one of these gifts, and can then either consume it as part of the same action or do so with a separate Interact action later in the spell's duration\.$/,
        /^Enemies who attempt to pick up one of these gifts find that it turns to ash in their hands\.$/, /^Each time a character consumes one of these gifts, they can select one of the following benefits\.$/,
        /^The character regains (\d+)d(\d+) Hit Points\.$/, /^The character reduces the stage of one (poison) or (disease) they suffer from by one stage\.$/, /^This can't reduce the stage below 1 or cure the affliction\.$/,
        /^The character reduces the value of their (@UUID\[[^\]]+\]\{[A-Za-z]+\}(?:, (?:or )?@UUID\[[^\]]+\]\{[A-Za-z]+\})+) condition by (\d+), or reduces two of the listed conditions by (\d+) each\.$/];
    const found = matchAll(lead, LEAD);
    if (!found.every(Boolean) || unread(lead, found, [/^You call forth a flock\b[^\d]*$/]).length) return null;
    const step = /^Heightened \(\+(\d+)\) The amount of Hit Points a character regains from consuming a gift increases by (\d+)d(\d+)\.$/.exec(plain(parts[1]));
    const seconds = minutes(adapted) * 60, rank = Number(adapted.rank);
    const [, , , heal, afflictions, , conditions] = found;
    if (!step || Number(step[3]) !== Number(heal[2]) || !Number.isFinite(seconds)) return null;
    const slugs = [...conditions[1].matchAll(/@UUID\[[^\]]+\]\{([A-Za-z]+)\}/g)].map(match => match[1].toLowerCase());
    return {
        parts: [{ key: "gift", title: "A gift is consumed", kind: "gift", radius: Number(adapted.targeting.area.value),
            heal: `(${heal[1]} + ${step[2]} * floor((@item.rank - ${rank}) / ${step[1]}))d${heal[2]}`, afflictions: [afflictions[1], afflictions[2]], conditions: slugs, by: Number(conditions[2]), eachBy: Number(conditions[3]),
            repeat: { trigger: "a character consumes another gift during the spell" },
            reminder: `Target the character (the caster or an ally within ${adapted.targeting.area.value} feet when it collects the gift) and pick its benefit: Hit Points, an affliction's stage, or the conditions.` }],
        lasting: { seconds, sustained: false },
        notes: [],
        claimed: [...found.map(match => match[0]), ...lead.filter(sentence => /^You call forth a flock\b/.test(sentence)), plain(parts[1]), plain(html.match(/<ul>[\s\S]*<\/ul>/)?.[0] ?? "")]
    };
}
