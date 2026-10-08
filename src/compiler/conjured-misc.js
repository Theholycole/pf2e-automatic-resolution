// The rest of the conjured-creature and control spells (feature group 2), each read from its text into a card of parts:
//   - a borrowed illusion (Shadow Illusion): "If the illusion is a creature, shadow illusion has the effects of an {Illusory Creature} spell of the same rank,
//     except it deals 3d8 damage" — the referenced spell's own route, its Strike's dice the text's;
//   - a summon's boost (Primal Summons): PF2e's linked Effect on the creature the next Summon Animal or Summon Plant or Fungus makes;
//   - a named summon (Gray Shadow): "You summon a {Greater Shadow} in a space adjacent to the dying creature." with PF2e's Effect on it, ending when the dying
//     creature dies or regains consciousness;
//   - a corpse raised as a listed stat block (Shambling Horror): the tables' {creatures}, of the corpse's size and at most its level, a minion at the corpse;
//   - a familiar's form (Patron's Protector): its AC, size and temporary Hit Points (by rank), 1 HP instead of 0, and its two actions;
//   - a weapon that Strikes on a trigger (Weapon of Judgment): the caster's melee spell attack, the GM's report of war or peace;
//   - a shell the GM reports creatures crossing (Blessed Boundary): its basic save and push, each time.
import { SIZE_SLUGS as SIZE, SPELL, plainOrEmpty as plain, sentenceSplit as sentencesOf } from "./text-patterns.js";

const ACTOR = String.raw`@UUID\[(Compendium\.pf2e\.[a-z-]+\.Actor\.[A-Za-z0-9]+)\]\{([^}]+)\}`;
const EFFECT = String.raw`@UUID\[(Compendium\.pf2e\.spell-effects\.Item\.[^\]]+)\]\{(Spell Effect: [^}]+)\}`;

/** Shadow Illusion: {uuid, dice, faces, step: {interval, dice}, notes} or null. */
export function extractBorrowedIllusion(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened = ""] = html.split(/<hr\s*\/?>/i);
    const text = plain(body);
    const borrow = new RegExp(String.raw`If the illusion is a creature, [a-z ]+ has the effects of an? ${SPELL} spell of the same rank, except it deals (\d+)d(\d+) damage, instead of the amount listed in [a-z ]+\.`).exec(text);
    if (!borrow) return null;
    const step = /^Heightened \(\+(\d)\) The area that an illusory object can fit in increases by (\d+) feet\. The damage of the illusory creature's Strike increases by (\d+)d(\d+)\.$/.exec(plain(heightened));
    if (!step || step[4] !== borrow[4]) return null;
    const rest = sentencesOf(text.replace(borrow[0], "").trim());
    const object = rest.find(sentence => /^If the illusion is an object, it must fit within a (\d+)-foot burst, and the creature can be of any size up to (Gargantuan|Huge|Large)/.test(sentence));
    const light = rest.find(sentence => /^The spell ends if the illusion is ever out of an area of dim light or darkness\.$/.test(sentence));
    if (!object || !light) return null;
    const max = /up to (Gargantuan|Huge|Large)/.exec(object)[1];
    return { uuid: borrow[1], name: borrow[2], dice: Number(borrow[3]), faces: Number(borrow[4]), step: { interval: Number(step[1]), dice: Number(step[3]) }, maxSize: SIZE[max],
        notes: [`${rest[0]} ${light}`, `${object} (An object: the GM's; it's a still image.)`, `${rest.find(sentence => /^The object or creature appears to animate naturally/.test(sentence)) ?? ""}`].filter(Boolean),
        sourceText: text };
}

/** Primal Summons: {effect: {uuid, name}, spells, text} or null. */
export function extractSummonBoost(adapted) {
    const text = plain(adapted.descriptionHTML);
    const m = new RegExp(String.raw`^You enhance a summoned creature with the power of the elements\. If your next action is to cast either ${SPELL} or ${SPELL}, choose ([a-z, ]+); the creature you summon gains the corresponding abilities\.`).exec(text);
    const effect = new RegExp(EFFECT).exec(String(adapted.descriptionHTML ?? ""));
    if (!m || !effect) return null;
    return { effect: { uuid: effect[1], name: effect[2] }, spells: [m[2], m[4]], choices: m[5].split(/,\s*(?:or\s+)?|\s+or\s+/).filter(Boolean), sourceText: m[0] };
}

/** Gray Shadow: {actorUuid, actorName, effect, ends, origin} or null. */
export function extractNamedSummon(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    if (!/^1 dying creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const summon = new RegExp(String.raw`You summon an? ${ACTOR} in a space adjacent to the dying creature\. The [a-z ]+ has its usual stats, with the following modifications:`).exec(plain(html));
    const effect = new RegExp(EFFECT).exec(html);
    const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => plain(m[1].replace(new RegExp(EFFECT, "g"), "")));
    const ends = /If the dying creature targeted by this spell dies or regains consciousness, the [a-z ]+ disappears and this spell ends\./.exec(plain(html));
    if (!summon || !effect || items.length !== 2 || !ends) return null;
    if (!/^The [a-z ]+'s [a-z ]+ Strike deals an additional \d+d\d+ [a-z]+ damage\.$/.test(items[0])) return null;
    if (!/^When you Cast a Spell, you can use the [a-z ]+'s location as the origin point instead of your own location\. Upon doing so, the [a-z ]+ immediately disappears\.$/.test(items[1])) return null;
    return { actorUuid: summon[1], actorName: summon[2], effect: { uuid: effect[1], name: effect[2], claim: items[0] }, origin: items[1], ends: ends[0], sourceText: [summon[0], ...items, ends[0]].join(" ") };
}

/** Shambling Horror: {candidates: [{uuid, name, level, size}], minion, notes} or null. */
export function extractCorpseStatBlock(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const lead = /You reanimate the corpse of a fallen creature as an undead minion under your control\. The reanimated creature is an undead ([a-z]+) or ([a-z]+)\. Choose a \1 or \2 stat block of the same size as the original creature and of a level no higher than the creature's original level\./.exec(plain(html));
    if (!lead) return null;
    const candidates = [];
    // (A row's creature linked, or only named: the GM's Actor compendiums are searched by that name.)
    for (const row of html.matchAll(/<tr>\s*<td>\s*(-?\d+)\s*<\/td>\s*<td>\s*(Tiny|Small|Medium|Large|Huge|Gargantuan)\s*<\/td>\s*<td>\s*(?:@UUID\[(Compendium\.pf2e\.[a-z-]+\.Actor\.[A-Za-z0-9]+)\]\{([^}]+)\}|([A-Z][A-Za-z' -]+))\s*<\/td>\s*<\/tr>/g))
        candidates.push({ level: Number(row[1]), size: SIZE[row[2]], uuid: row[3] ?? null, name: (row[4] ?? row[5]).trim() });
    if (candidates.length < 10) return null;
    const keeps = /The [a-z ]+ keeps Speeds it had in life, as well as melee Strikes that deal only physical damage\. These attacks use the highest attack modifier from the [a-z ]+ you choose\./.exec(plain(html));
    const minion = /A [a-z ]+ has the minion trait\./.exec(plain(html));
    const one = /You can't control more than one [a-z ]+ at the same time[^.]*\./.exec(plain(html));
    if (!keeps || !minion || !one) return null;
    return { candidates, notes: [`${keeps[0]} The GM makes the final choice of what abilities it has.`, one[0], "After the next sunrise, the corpse can't be animated this way again."], sourceText: lead[0] };
}

/** Patron's Protector: {ac, size, temp, zeroToOne, bodyCheck, shove, heightened} or null. */
export function extractFamiliarForm(adapted) {
    if (!/^your familiar$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened = ""] = html.split(/<hr\s*\/?>/i);
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => plain(m[1]));
    if (paragraphs.length !== 3) return null;
    const form = /Your familiar's AC becomes (\d+); they become (large|huge|medium), and they gain (\d+) temporary Hit Points\. If your familiar is reduced to 0 Hit Points while under the effect of this spell, the spell immediately ends, and your familiar is instead reduced to 1 Hit Point\. Once per turn your familiar can use the ([A-Z][A-Za-z' ]+?) or ([A-Z][A-Za-z' ]+?) action\./.exec(paragraphs[0]);
    const body1 = /^Body Check\s*1?\s*Your familiar uses its new size and presence to press against an adjacent creature, dealing, @Damage\[(\d+d\d+)\[([a-z]+)\]\] damage \(basic (Fortitude|Reflex|Will) save\)\. On a failed save, the target is also knocked back (\d+) feet \((\d+) feet on a critical failure\)\.$/.exec(paragraphs[1]);
    const shove = /^Protector's Shove\s*1?\s*Your familiar shoves an ally out of danger\. Your familiar pushes an adjacent, willing ally, pushing them up to (\d+) feet away and granting them a \+(\d) (status|circumstance) bonus to AC for (\d+) rounds?\. This is forced movement\.$/.exec(paragraphs[2]);
    const at = /^Heightened \((\d+)(?:st|nd|rd|th)\) The familiar's AC become (\d+), they gain (\d+) temporary Hit Points, and the damage increases by (\d+)d(\d+)\.$/.exec(plain(heightened));
    if (!form || !body1 || !shove || !at || !/Command an Animal/.test(paragraphs[0])) return null;
    const dice = /^(\d+)d(\d+)$/.exec(body1[1]);
    if (dice[2] !== at[5]) return null;
    return {
        ac: { base: Number(form[1]), byRank: { [at[1]]: Number(at[2]) } }, size: { large: "lg", huge: "huge", medium: "med" }[form[2]], temp: { base: Number(form[3]), byRank: { [at[1]]: Number(at[3]) } },
        bodyCheck: { dice: Number(dice[1]), faces: Number(dice[2]), type: body1[2], statistic: body1[3].toLowerCase(), push: { failure: Number(body1[4]), criticalFailure: Number(body1[5]) }, heightened: { rank: Number(at[1]), dice: Number(at[4]) }, sourceText: paragraphs[1] },
        shove: { feet: Number(shove[1]), bonus: Number(shove[2]), type: shove[3], rounds: Number(shove[4]), sourceText: paragraphs[2] },
        actions: [form[4], form[5]], command: "You can use Command an Animal on the familiar as part of Casting or Sustaining this spell.", sourceText: paragraphs[0]
    };
}

/** Weapon of Judgment: {dice, faces, types, war, peace, notes} or null. */
export function extractJudgmentWeapon(adapted) {
    const html = String(adapted.descriptionHTML ?? "");
    const [body, heightened = ""] = html.split(/<hr\s*\/?>/i);
    const text = plain(body);
    const war = /If you name "war," mentally choose one creature\.[^"]*?At the end of each of the target's turns, if the target didn't use a hostile action against the creature you chose during that turn, the weapon Strikes the target\./.exec(text);
    const peace = /If you name "peace," mentally choose up to (\w+) allies\.[^"]*?The weapon Strikes the target each time the target uses a hostile action against you or one of the chosen allies\. The weapon Strikes only once per action[^.]*\.\)?\.?/.exec(text);
    const strike = /Strikes with the weapon are melee weapon attacks, but they use your spell attack modifier\. Regardless of its appearance, the weapon deals (\d+)d(\d+) damage\. The damage type is the same as the chosen weapon \(or any of its types for a versatile weapon\)\. The attack deals ([a-z]+) damage instead if that would be more detrimental to the creature \(as determined by the GM\)\./.exec(text);
    const map = /The weapon takes a multiple attack penalty, which increases throughout the target's turn, but its penalty is separate from yours\./.test(text);
    const at = /^Heightened \((\d+)(?:st|nd|rd|th)\) The damage increases by (\d+)d(\d+)\.$/.exec(plain(heightened));
    if (!war || !peace || !strike || !map || !at || at[3] !== strike[2]) return null;
    return { dice: Number(strike[1]), faces: Number(strike[2]), alternative: strike[3], heightened: { rank: Number(at[1]), dice: Number(at[2]) },
        notes: ["Name war or peace when you cast it. War: you choose one creature; the weapon Strikes the target at the end of each of its turns in which it didn't use a hostile action against that creature. Peace: you choose up to five allies; the weapon Strikes the target each time it uses a hostile action against you or one of them (once per action).",
            "The weapon's multiple attack penalty increases through the target's turn and is separate from yours: pick its attack number on the card. It's a weapon for triggers and resistances; it doesn't take up space or flank."],
        sourceText: [war[0], peace[0], strike[0]].join(" ") };
}

/** Blessed Boundary: {html, notes, trigger} or null. */
export function extractShell(adapted) {
    if (adapted.defense?.kind !== "save") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = "", heightened = ""] = html.split(/<hr\s*\/?>/i);
    const text = plain(intro);
    const deals = /The shell deals (\d+d\d+) ([a-z]+) damage to each creature who intersects with the shell when the sphere's created, or who attempts to move through the shell\. The creature also takes the damage at the end of its turn, but only if it didn't already take damage from the shell that turn\. The effects are determined by a creature's (Fortitude|Reflex|Will) save\./.exec(text);
    const smaller = /You can choose to make the burst smaller, in (\d+)-foot increments, when you cast it\./.exec(text);
    const cover = /The shell provides cover and can intersect solid terrain without affecting it\./.exec(text);
    if (!deals || !smaller || !cover) return null;
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(table);
        if (!m) return null;
        rows[key] = plain(m[1]);
    }
    const push = degree => /^The creature takes (full|double) damage, is pushed up to (\d+) feet in the direction of your choice, and ends its movement\.$/.exec(rows[degree]);
    const failure = push("failure"), critical = push("criticalFailure");
    if (rows.criticalSuccess !== "The creature is unaffected." || rows.success !== "The creature takes half damage." || !failure || !critical || failure[1] !== "full" || critical[1] !== "double") return null;
    const step = /^Heightened \(\+1\) The damage increases by 1d(\d+)\.$/.exec(plain(heightened));
    const dice = /^(\d+)d(\d+)$/.exec(deals[1]);
    if (!step || step[1] !== dice[2]) return null;
    // (Spaced: Foundry would read "@item.rank-6" as one data path, worth 0.)
    return { formula: `(${dice[1]}+@item.rank - ${adapted.rank})d${dice[2]}`, type: deals[2], statistic: deals[3].toLowerCase(), push: { failure: Number(failure[2]), criticalFailure: Number(critical[2]) },
        trigger: "a creature intersects the shell as it's created or moves through it, or ends its turn in it without having taken this damage that turn",
        notes: [`${text.split(/(?<=\.)\s+/).slice(0, 4).join(" ")} ${smaller[0]} ${cover[0]} (Place the sphere; the module doesn't track who crosses its shell.)`],
        sourceText: deals[0] };
}
