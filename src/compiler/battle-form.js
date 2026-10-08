// A battle form PF2e has no Effect for (The Everfull Moon; user decision 2026-10-01: the module generates the battle form from the text):
//   "You transform yourself into a Large hybrid wolf battle form. While in this form, you gain the beast trait. This battle form doesn't prevent
//   you from speaking, casting spells, or using your hands." with the list "AC = 18 + your level. …" / "A +1 status bonus to saving throws." /
//   "20 temporary Hit Points." / "Darkvision and scent as an imprecise sense with a range of 30 feet." / "Your proficiency bonus equals your level
//   for untrained skill checks using Acrobatics or Athletics." / the Strikes (attack modifier, damage, traits) / "Speed of 40 feet, unless your
//   own is higher.", Fuel ("you gain 20 temporary Hit Points"), the Lethologic Mark (a weakness to silver equal to your level, at night but not
//   the new moon) and "Heightened (+2) The temporary Hit Points … increase by 20. All unarmed Strikes … deal an additional die of damage. Your
//   attack modifier increases by +6. Finally, your AC increases by 2."
// The form is PF2e's BattleForm rule (its brackets for the heightened ranks) plus the save bonus and the untrained proficiency; Fuel is an Ongoing
// control (the temporary Hit Points at the cast rank); the mark is a lasting Effect with the weakness behind a night toggle.
import { htmlToPlainText } from "./description-parser.js";
import { SIZE_SLUGS_TO_HUGE as SIZES } from "./text-patterns.js";

const FORM = /^You transform yourself into an? (Tiny|Small|Medium|Large|Huge) [a-z ]+ battle form\.$/;
const TRAIT = /^While in this form, you gain the ([a-z]+) trait\.$/;
const FREE = /^This battle form doesn't prevent you from speaking, casting spells, or using your hands\.$/;
const ITEMS = {
    ac: /^AC = (\d+) \+ your level\. Ignore your armor's check penalty and Speed reduction\.$/,
    saves: /^A \+(\d) status bonus to saving throws\.$/,
    tempHP: /^(\d+) temporary Hit Points\.$/,
    senses: /^Darkvision and scent as an imprecise sense with a range of (\d+) feet\.$/,
    skills: /^Your proficiency bonus equals your level for untrained skill checks using (Acrobatics) or (Athletics)\.$/,
    strikesIntro: /^The [a-z]+ and [a-z]+ unarmed melee attacks detailed below\. You're trained with them, your attack modifier is \+(\d+), and you use the listed damage\. These attacks are Strength based \(for the purpose of the enfeebled condition, for example\)\. If your unarmed attack modifier is higher, you can use it instead\.$/,
    speed: /^Speed of (\d+) feet, unless your own is higher\.$/
};
const STRIKE = /^Melee (?:1 )?([a-z]+) \(([a-z, ]+)\), Damage (\d+)d(\d+) ([a-z]+)\.$/;
const FUEL = /^When you Fuel [A-Z][A-Za-z ]+, you gain (\d+) temporary Hit Points\.$/;
const MARK = /^Lethologic Mark During any night that isn't the new moon, you gain a weakness to ([a-z]+) equal to your level\. (The mark is healed if you become a true werewolf and become cured of said curse\.)$/;
const STEP = /^Heightened \(\+(\d)\) The temporary Hit Points granted by this spell when you cast or Fuel it increase by (\d+)\. All unarmed Strikes granted by this spell deal an additional die of damage\. Your attack modifier increases by \+(\d+)\. Finally, your AC increases by (\d+)\.$/;

/** Returns {battleForm, claimed} or null. */
export function compileBattleForm(adapted) {
    const fixed = /^(\d+) (minute|round)s?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const traits = adapted.activation?.traits ?? [];
    if (adapted.defense?.kind !== "none" || !fixed || !traits.includes("polymorph") || String(adapted.targeting?.target ?? "").trim()) return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (sections.length !== 3) return null;
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(sections[0]);
    if (!list) return null;
    const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = htmlToPlainText(sections[0].slice(0, list.index)).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    const after = htmlToPlainText(sections[0].slice(list.index + list[0].length)).replace(/\s+/g, " ").trim();
    const formAt = lead.findIndex(sentence => FORM.test(sentence));
    if (formAt < 0 || !TRAIT.test(lead[formAt + 1] ?? "") || !FREE.test(lead[formAt + 2] ?? "")) return null;
    // Narration before the form; "You gain the following abilities." (as often as it's repeated) after it.
    if (lead.slice(0, formAt).some(sentence => /\d|\+|\bbonus\b|\bdamage\b/.test(sentence)) || lead.slice(formAt + 3).some(sentence => sentence !== "You gain the following abilities.")) return null;
    const found = {}, strikes = {};
    for (const item of items) {
        const key = Object.keys(ITEMS).find(name => ITEMS[name].test(item));
        if (key && !found[key]) { found[key] = ITEMS[key].exec(item); continue; }
        const strike = STRIKE.exec(item);
        if (strike && !strikes[strike[1]]) { strikes[strike[1]] = { traits: strike[2].split(/,\s*/), dice: Number(strike[3]), die: `d${strike[4]}`, damageType: strike[5] }; continue; }
        return null;
    }
    const fuel = FUEL.exec(after), mark = MARK.exec(htmlToPlainText(sections[1]).replace(/\s+/g, " ").trim()), step = STEP.exec(htmlToPlainText(sections[2]).replace(/\s+/g, " ").trim());
    if (Object.keys(found).length !== Object.keys(ITEMS).length || Object.keys(strikes).length !== 2 || !fuel || !mark || !step) return null;
    const [, size] = FORM.exec(lead[formAt]);
    const attack = Number(found.strikesIntro[1]), acBase = Number(found.ac[1]), tempHP = Number(found.tempHP[1]);
    const interval = Number(step[1]), hpStep = Number(step[2]), attackStep = Number(step[3]), acStep = Number(step[4]);
    const strikeRule = (bonus, extraDice) => Object.fromEntries(Object.entries(strikes).map(([name, data]) => [name, { ability: "str", category: "unarmed",
        damage: { damageType: data.damageType, dice: data.dice + extraDice, die: data.die }, modifier: attack + bonus, ownIfHigher: true,
        traits: ["unarmed", ...data.traits.filter(trait => trait !== "reach").concat(data.traits.includes("reach") ? ["reach"] : [])] }]));
    const brackets = [];
    for (let rank = Number(adapted.rank) + interval, steps = 1; rank <= 10; rank += interval, steps++)
        brackets.push({ start: rank, value: { armorClass: { modifier: `${acBase + acStep * steps} + @actor.level` }, tempHP: tempHP + hpStep * steps, strikes: strikeRule(attackStep * steps, steps) } });
    const battleForm = { key: "BattleForm", canCast: true, canSpeak: true, hasHands: true, brackets, overrides: {
        armorClass: { modifier: `${acBase} + @actor.level`, ignoreCheckPenalty: true, ignoreSpeedReduction: true }, tempHP, size: SIZES[size], traits: [TRAIT.exec(lead[formAt + 1])[1]],
        senses: { darkvision: {}, scent: { acuity: "imprecise", range: Number(found.senses[1]) } }, speeds: { land: Number(found.speed[1]) }, strikes: strikeRule(0, 0) } };
    const rules = [battleForm,
        { key: "FlatModifier", selector: "saving-throw", type: "status", value: Number(found.saves[1]) },
        { key: "FlatModifier", selector: [found.skills[1].toLowerCase(), found.skills[2].toLowerCase()], type: "proficiency", value: "@actor.level", predicate: ["proficiency:untrained"] }];
    return {
        battleForm: { rules, durationSeconds: Number(fixed[1]) * (fixed[2].toLowerCase() === "round" ? 6 : 60), baseRank: Number(adapted.rank),
            fuel: { tempHP, step: hpStep, interval }, mark: { weakness: mark[1], text: mark[0].replace(/^Lethologic Mark /, ""), healNote: mark[2] } },
        claimed: [...lead, ...items, after, mark[0], step[0]]
    };
}
