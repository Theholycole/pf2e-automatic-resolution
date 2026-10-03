// Armor of rolled colors, each a resistance, that dazzles adjacent attackers (Chromatic Armor): "You wrap the target in armor made of sheets of colored
// light. The armor sheds bright light for 20 feet (and dim light for the next 20 feet). Whenever a creature attacks the target and is adjacent to it, the
// attacker must attempt a Will save at the end of its action. On a failure, it becomes {Dazzled} until the end of its next turn. Regardless of the result of
// the save, the attacker is temporarily immune until the end of its next turn. The dazzling effect has the light and visual traits." / "When you cast the
// spell, roll [[/r 2d8]]{1d8 twice} on the table below to see the armor's colors (rerolling any duplicates). Each color grants resistance 5 to the indicated
// damage type. If you spend three actions to Cast the Spell, roll [[/r 3d8]]{three} times instead." with the table (seven colors and their types, then
// "Matching Color …") and "Heightened (+3) The resistance is increased by 5." — the target's Effect: the rolled colors' resistances at the cast rank and the
// light; the 8 is the GM's answer (the type the target took most recently in the past minute, or a reroll); the card's control for an adjacent attacker
// posts its Will save (a failure Dazzled until the end of its next turn), after which it's temporarily immune until the end of its next turn.
import { htmlToPlainText } from "./description-parser.js";
import { adaptSpellSource } from "./spell-source-adapter.js";

const LEAD = [/^You wrap the target in armor made of sheets of colored light\.$/,
    /^The armor sheds bright light for (\d+) feet \(and dim light for the next (\d+) feet\)\.$/,
    /^Whenever a creature attacks the target and is adjacent to it, the attacker must attempt a (Will|Fortitude|Reflex) save at the end of its action\.$/,
    /^On a failure, it becomes (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Dazzled\}) until the end of its next turn\.$/,
    /^Regardless of the result of the save, the attacker is temporarily immune until the end of its next turn\.$/,
    /^The dazzling effect has the ([a-z]+) and ([a-z]+) traits\.$/,
    /^When you cast the spell, roll \[\[\/r (\d)d8\]\]\{[^}]+\} on the table below to see the armor's colors \(rerolling any duplicates\)\.$/,
    /^Each color grants resistance (\d+) to the indicated damage type\.$/,
    /^If you spend three actions to Cast the Spell, roll \[\[\/r (\d)d8\]\]\{[^}]+\} times instead\.$/];
const MATCHING = /^The armor becomes the color matching the type of damage the target took most recently in the past minute\. If it didn't take any of those seven types of damage or the armor is already that color, roll again, rerolling any results of 8\.$/;
const STEP = /^Heightened \(\+(\d)\) The resistance is increased by (\d+)\.$/;

/** {colorArmor, claimed} or null. */
export function compileColorArmor(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "").split(/<hr\s*\/?>/i);
    const list = /<ol>([\s\S]*?)<\/ol>/.exec(body);
    if (!minutes || rest.length || !list) return null;
    const plain = html => htmlToPlainText(html).replace(/\s+/g, " ").trim();
    const sentences = plain(body.replace(list[0], "")).split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    if (sentences.length !== LEAD.length || LEAD.some((pattern, index) => !pattern.test(sentences[index]))) return null;
    const rows = [...list[1].matchAll(/<li>\s*<strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g)].map(match => [match[1].trim(), plain(match[2])]);
    if (rows.length !== 8 || !MATCHING.test(rows[7][1]) || rows.slice(0, 7).some(([, type]) => !/^[a-z]+$/.test(type))) return null;
    const step = STEP.exec(plain(heightened));
    if (heightened.trim() && !step) return null;
    const m = index => LEAD[index].exec(sentences[index]);
    return { colorArmor: { seconds: Number(minutes[1]) * 60, light: { bright: Number(m(1)[1]), dim: Number(m(1)[1]) + Number(m(1)[2]) },
            colors: rows.slice(0, 7).map(([name, type], index) => ({ roll: index + 1, name, type })), rolls: { two: Number(m(6)[1]), three: Number(m(8)[1]) },
            resistance: { base: Number(m(7)[1]), step: step ? Number(step[2]) : 0, interval: step ? Number(step[1]) : 1 },
            save: { statistic: m(2)[1].toLowerCase(), condition: m(3)[1], traits: [m(5)[1], m(5)[2]] } },
        claimed: [...sentences, ...rows.map(row => row.join(" ")), ...(step ? [step[0]] : [])] };
}

// The armor in every color (Prismatic Armor): "You wrap the target in armor made of multicolored light. It functions as {Chromatic Armor} that is all colors (granting
// resistance 5 to acid, electricity, fire, force, mental, poison, and sonic). An attacker that critically fails on its saving throw against the spell is {Blinded}
// rather than {Dazzled}." with "Heightened (9th) The resistances increase to 10 each." — the referenced armor's reading (its light, save and timing), every color
// at once (no roll), the stated resistance (and its fixed-rank value), and a critical failure's Blinded.
const PRISM = {
    lead: /^You wrap the target in armor made of [a-z ]+ light\.$/,
    functions: /^It functions as @UUID\[(Compendium\.pf2e\.spells-srd\.Item\.[A-Za-z0-9]+)\]\{[^}]+\} that is all colors \(granting resistance (\d+) to ([a-z, ]+)\)\.$/,
    critical: /^An attacker that critically fails on its saving throw against the spell is (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\}) rather than (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Z][a-z]+\})\.$/,
    step: /^Heightened \((\d+)(?:st|nd|rd|th)\) The resistances increase to (\d+) each\.$/
};
/** {colorArmor, claimed} or null. */
export function compileBorrowedColorArmor(adapted, referencedSpells) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^1 willing creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").replace(/<p>\s*@UUID\[Compendium\.pf2e\.spell-effects\.Item\.[^\]]+\]\{[^}]+\}\s*<\/p>/g, "").split(/<hr\s*\/?>/i);
    if (!minutes || rest.length) return null;
    const sentences = body.replace(/<\/?p>/g, " ").replace(/\s+/g, " ").trim().split(/(?<=[.!?)])\s+(?=[A-Z@])/).filter(Boolean);
    const functions = PRISM.functions.exec(sentences[1] ?? ""), critical = PRISM.critical.exec(sentences[2] ?? "");
    if (sentences.length !== 3 || !PRISM.lead.test(sentences[0]) || !functions || !critical) return null;
    const source = referencedSpells?.get?.(functions[1]);
    const base = source ? compileColorArmor(adaptSpellSource(source)) : null;
    if (!base || !new RegExp(`\\{${base.colorArmor.save.condition.replace(/^.*\{|\}$/g, "")}\\}$`).test(critical[2])) return null;
    const types = functions[3].split(/,\s*(?:and\s+)?|\s+and\s+/).map(type => type.trim()).filter(Boolean);
    if (types.length !== base.colorArmor.colors.length || !base.colorArmor.colors.every(color => types.includes(color.type))) return null;
    const plainStep = htmlToPlainText(heightened).replace(/\s+/g, " ").trim();
    const step = plainStep ? PRISM.step.exec(plainStep) : null;
    if (plainStep && !step) return null;
    return { colorArmor: { ...base.colorArmor, seconds: Number(minutes[1]) * 60, allColors: true,
            resistance: { base: Number(functions[2]), step: 0, interval: 1, ...(step ? { fixed: { rank: Number(step[1]), value: Number(step[2]) } } : {}) },
            save: { ...base.colorArmor.save, criticalCondition: critical[1] } },
        claimed: [...sentences.map(sentence => htmlToPlainText(sentence)), ...(step ? [plainStep] : [])] };
}

/** The resistance at a cast rank. */
export function colorArmorResistance(data, castRank, baseRank) {
    if (data.resistance.fixed && Number(castRank) >= data.resistance.fixed.rank) return data.resistance.fixed.value;
    return data.resistance.base + Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / data.resistance.interval)) * data.resistance.step;
}
