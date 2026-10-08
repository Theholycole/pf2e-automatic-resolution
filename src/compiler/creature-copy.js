// A copy of a creature fighting for the caster:
//   - Duplicate Foe (the target's save): "You create a temporary duplicate of an enemy to fight on your behalf. The target can attempt a Fortitude save to
//     disrupt the spell. The duplicate appears in an unoccupied space adjacent to the target and has the target's attack modifier, AC, saving throw
//     modifiers, Perception, and skill modifiers, but it has only 70 Hit Points and lacks the target's special abilities, … The duplicate is unstable, so
//     each turn after it takes its actions, it loses 4d6 Hit Points. …" with rows "Critical Success You fail to create a duplicate." / "Success The duplicate
//     deals half damage with its Strikes and the duration is reduced to a maximum of 2 rounds." / "Failure The duplicate works as described." and
//     "Heightened (+1) The level of creature you can target increases by 2. The duplicate has 10 more HP.";
//   - Reanimate Foe (the caster's check): "You launch a thrall up to 30 feet into the corpse of an enemy that has been dead for no more than 1 minute,
//     destroying the thrall … Attempt an Undead Lore check against the standard DC of the level of enemy you're trying to reanimate." with "Success The
//     enemy reanimates … it has only 100 Hit Points … Each turn after it takes its actions, it loses 15 Hit Points. … The reanimated creature lasts for 1
//     minute or until it's reduced to 0 Hit Points." / "Failure As success, but the reanimated enemy deals half damage with its Strikes and loses 50 Hit
//     Points each turn instead of 15." / "Critical Failure You create a thrall in the corpse's space, but you don't spend the Focus Point for casting this spell."
// The copy is a module token (copyCreature): the stated Hit Points, its statistics, its Strikes without added effects, no special abilities, a minion.
import { plainOrEmpty as plain } from "./text-patterns.js";

const rowsOf = html => {
    const rows = {};
    for (const [key, heading] of [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]]) {
        const m = new RegExp(String.raw`<strong>\s*${heading}\s*</strong>([\s\S]*?)</p>`).exec(html);
        rows[key] = m ? plain(m[1]) : null;
    }
    return rows;
};
const STATS = String.raw`(?:the target's|the same) attack modifier, AC, saving throw modifiers, Perception, and skill modifiers, but it has only (\d+) Hit Points and lacks (?:the target's|all) special abilities, including immunities, resistances, and weaknesses`;

const DUPLICATE = [
    /^You create a temporary duplicate of an enemy to fight on your behalf\.$/,
    /^The target can attempt an? (Fortitude|Reflex|Will) save to disrupt the spell\.$/,
    new RegExp(String.raw`^The duplicate appears in an unoccupied space adjacent to the target and has ${STATS}\.$`),
    /^It has no magic items except weapon potency runes\.$/,
    /^The duplicate gains the minion trait, and it can only Stride and Strike\.$/,
    /^Its Strikes deal the target's normal damage but don't apply added effects, since it doesn't have special abilities\.$/,
    /^The spell automatically ends if the duplicate's Hit Points drop to 0\.$/,
    /^The duplicate attacks your enemies to the best of its abilities\.$/,
    /^You can also try to give it additional instructions; when you Sustain the spell, you can also Command a Minion as part of your action, but the GM determines whether the duplicate follows your command\.$/,
    /^The duplicate is unstable, so each turn after it takes its actions, it loses (\d+d\d+) Hit Points\.$/,
    /^It's not a living creature, and it can never regain its lost Hit Points in any way\.$/
];

/** Duplicate Foe: {statistic, hp, hpLoss, byDegree, heightening, notes} or null. */
export function extractDuplicateFoe(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = "", heightened = ""] = html.split(/<hr\s*\/?>/i);
    const sentences = plain(intro).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== DUPLICATE.length) return null;
    const m = DUPLICATE.map((pattern, index) => pattern.exec(sentences[index]));
    if (m.some(hit => !hit) || m[1][1].toLowerCase() !== adapted.defense.statistic) return null;
    const rows = rowsOf(table);
    if (rows.criticalSuccess !== "You fail to create a duplicate." || rows.failure !== "The duplicate works as described." || rows.criticalFailure != null) return null;
    const success = /^The duplicate deals half damage with its Strikes and the duration is reduced to a maximum of (\d+) rounds\.$/.exec(rows.success ?? "");
    if (!success) return null;
    const step = /^Heightened \(\+(\d+)\) The level of creature you can target increases by (\d+)\. The duplicate has (\d+) more HP\.$/.exec(plain(heightened));
    if (heightened.trim() && !step) return null;
    return {
        statistic: m[1][1].toLowerCase(), hp: Number(m[2][1]), hpLoss: m[9][1],
        heightening: step ? { interval: Number(step[1]), levels: Number(step[2]), hp: Number(step[3]) } : null,
        byDegree: { success: { halfDamage: true, maxRounds: Number(success[1]) }, failure: {}, criticalFailure: {} },
        notes: [sentences[8], "It attacks your enemies as best it can; it can only Stride and Strike."],
        sourceText: sentences.join(" ")
    };
}

const REANIMATE_INTRO = [
    /^You launch a thrall up to (\d+) feet into the corpse of an enemy that has been dead for no more than (\d+) minutes?, destroying the thrall in an effort to call the corpse to fight\.$/,
    /^Attempt an? ([A-Z][a-z]+ Lore) check against the standard DC of the level of enemy you're trying to reanimate\.$/,
    /^You can reanimate only corpses of creatures that were once living or undead\.$/
];
const REANIMATE_SUCCESS = [
    /^The enemy reanimates in an unoccupied space adjacent to its corpse\.$/,
    /^It's under your control and has the minion trait\.$/,
    new RegExp(String.raw`^It has ${STATS}\.$`),
    /^It has no magic items except the weapons and armor it used before death\.$/,
    /^Its Strikes deal the normal damage but don't apply added effects since the creature doesn't have special abilities\.$/,
    /^The reanimated foe is unstable and decays quickly\.$/,
    /^Each turn after it takes its actions, it loses (\d+) Hit Points\.$/,
    /^It can't regain its lost Hit Points in any way\.$/,
    /^The reanimated creature lasts for (\d+) minutes? or until it's reduced to 0 Hit Points\.$/
];

/** Reanimate Foe: {skill, thrallRange, deadFor, success: {hp, hpLoss, seconds}, failure, criticalFailure: {thrall: true}} or null. */
export function extractReanimateFoe(adapted) {
    if (adapted.defense?.kind && adapted.defense.kind !== "none") return null;
    const html = String(adapted.descriptionHTML ?? "");
    const [intro, table = ""] = html.split(/<hr\s*\/?>/i);
    const sentences = plain(intro).split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length !== REANIMATE_INTRO.length) return null;
    const m = REANIMATE_INTRO.map((pattern, index) => pattern.exec(sentences[index]));
    if (m.some(hit => !hit)) return null;
    const rows = rowsOf(table);
    if (rows.criticalSuccess != null || !rows.success || !rows.failure || !rows.criticalFailure) return null;
    const success = rows.success.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (success.length !== REANIMATE_SUCCESS.length) return null;
    const s = REANIMATE_SUCCESS.map((pattern, index) => pattern.exec(success[index]));
    if (s.some(hit => !hit)) return null;
    const failure = /^As success, but the reanimated enemy deals half damage with its Strikes and loses (\d+) Hit Points each turn instead of (\d+)\.$/.exec(rows.failure);
    if (!failure || Number(failure[2]) !== Number(s[6][1])) return null;
    if (!/^You create a thrall in the corpse's space, but you don't spend the Focus Point for casting this spell\.$/.test(rows.criticalFailure)) return null;
    const seconds = Number(s[8][1]) * 60;
    return {
        skill: m[1][1].toLowerCase().replace(/ /g, "-"), skillLabel: m[1][1], thrallRange: Number(m[0][1]), deadFor: Number(m[0][2]),
        success: { hp: Number(s[2][1]), hpLoss: s[6][1], seconds, halfDamage: false },
        failure: { hp: Number(s[2][1]), hpLoss: failure[1], seconds, halfDamage: true },
        criticalFailure: { thrall: true, focusRefund: true },
        sourceText: [...sentences, rows.success, rows.failure, rows.criticalFailure].join(" ")
    };
}
