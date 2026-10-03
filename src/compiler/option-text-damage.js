// A basic save whose damage the text states and whose type and critical-failure extra depend on an option the caster picks when
// casting (Flourishing Flora):
//   "All creatures in the target area take 2d4 damage. The type of damage depends on the type of plant you choose to grow. On a
//   critical failure, targets experience additional effects, also depending on what you choose to grow. The type of plant and its
//   effects are chosen when you Cast the Spell." and a list:
//   "Cacti Piercing damage, and @Damage[(@item.level)[bleed]] damage on a critical failure." / "Flowers Poison damage, and
//   @UUID[…]{Dazzled} for 2 rounds on a critical failure." / "Roots Bludgeoning damage, and the affected creatures fall
//   @UUID[…]{Prone} on a critical failure." with "Heightened (+1) The damage increases by 1d4, and the persistent bleed damage from
//   cacti increases by 1."
// Returns the rewritten description (an ordinary basic save), the damage component and formula, the options, and the claimed text.
import { extractScopedConditionReferences, htmlToPlainText } from "./description-parser.js";
import { compileEffectDuration } from "./duration-compiler.js";

const DAMAGE = /^All creatures in the (?:target )?area take (\d+)d(\d+) damage\.$/;
const FIXED_SENTENCES = [
    /^The type of damage depends on the type of ([a-z]+) you choose to [a-z]+\.$/,
    /^On a critical failure, targets experience additional effects, also depending on what you choose to [a-z]+\.$/,
    /^The type of ([a-z]+) and its effects are chosen when you Cast the Spell\.$/
];
const TYPES = new Set(["acid", "bludgeoning", "cold", "electricity", "fire", "force", "mental", "piercing", "poison", "slashing", "sonic", "spirit", "vitality", "void"]);
const OPTION = /^<strong>\s*([A-Z][a-z]+)\s*<\/strong>\s*([A-Z][a-z]+) damage, and (.+) on a critical failure\.$/;
const BLEED = /^@Damage\[\(@item\.(?:level|rank)\)\[bleed\]\] damage$/;
const CONDITION_FOR = /^(@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{[A-Za-z]+(?: \d)?\}) for (\d+) rounds?$/;
const FALL = /^the affected creatures fall (@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Prone\})$/;
const NARRATION_RULES = /\d|@|\b(?:damage|save|bonus|penalty|condition|can't|must|each|whenever|until|immune)\b/i;

/** Returns {html, component, formula, options, choiceLabel, claimed, note} or null. */
export function compileOptionTextDamage(adapted, lifecycle) {
    if (adapted?.defense?.kind !== "save" || adapted.defense.basic !== true || (adapted.damageComponents ?? []).length) return null;
    const html = String(adapted.descriptionHTML ?? "");
    const cut = html.search(/<p>\s*<strong>\s*Heightened/i);
    const base = (cut < 0 ? html : html.slice(0, cut)).replace(/<hr\s*\/?>\s*$/i, "");
    const list = /<ul>([\s\S]*?)<\/ul>/i.exec(base);
    if (!list || base.replace(list[0], "").match(/<ul>/i)) return null;
    const lead = htmlToPlainText(base.slice(0, list.index)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    if (htmlToPlainText(base.slice(list.index + list[0].length)).trim()) return null;
    const damageAt = lead.findIndex(sentence => DAMAGE.test(sentence));
    if (damageAt < 0 || lead.slice(0, damageAt).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const rest = lead.slice(damageAt + 1);
    if (rest.length !== FIXED_SENTENCES.length || rest.some((sentence, index) => !FIXED_SENTENCES[index].test(sentence))) return null;
    const noun = FIXED_SENTENCES[0].exec(rest[0])[1];
    if (FIXED_SENTENCES[2].exec(rest[2])[1] !== noun) return null;
    const [, dice, die] = DAMAGE.exec(lead[damageAt]);
    const options = {};
    let bleedOption = null;
    for (const [, item] of list[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
        const match = OPTION.exec(item.trim());
        if (!match) return null;
        const name = match[1].toLowerCase(), type = match[2].toLowerCase(), extra = match[3];
        if (!TYPES.has(type) || options[name]) return null;
        let critical;
        if (BLEED.test(extra)) {
            if (bleedOption) return null;
            bleedOption = name;
            critical = { kind: "formula", formula: "(@item.level)[bleed]" };
        } else {
            const condition = CONDITION_FOR.exec(extra) ?? FALL.exec(extra);
            const grant = condition ? (CONDITION_FOR.test(extra) ? `is ${condition[1]} for ${condition[2]} round${condition[2] === "1" ? "" : "s"}.` : `is knocked ${condition[1]}.`) : null;
            const found = grant ? extractScopedConditionReferences(grant) : [];
            if (found.length !== 1) return null;
            critical = { kind: "condition", effect: compileEffectDuration(found[0], grant, lifecycle) };
            if (CONDITION_FOR.test(extra) && critical.effect.duration?.value !== Number(condition[2])) return null;
        }
        options[name] = { type, critical, sourceText: htmlToPlainText(item).trim() };
    }
    if (Object.keys(options).length < 2) return null;
    // "Heightened (+1) The damage increases by 1d4, and the persistent bleed damage from cacti increases by 1.": the dice, and the bleed
    // (the rank) rising 1 a rank from the spell's rank.
    const heightened = /<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)(?:, and the persistent bleed damage from ([a-z]+) increases by (\d+))?\.\s*<\/p>/i.exec(html);
    if ((html.match(/<strong>\s*Heightened/gi) ?? []).length > (heightened ? 1 : 0) || (heightened && Number(heightened[3]) !== Number(die))) return null;
    if (bleedOption && (!heightened || heightened[4] !== bleedOption || Number(heightened[1]) !== 1 || Number(heightened[5]) !== 1 || Number(adapted.rank) !== 1)) return null;
    if (!bleedOption && heightened?.[4]) return null;
    const statistic = adapted.defense.statistic;
    const canonical = `You deal ${dice}d${die} damage to all creatures in the area, with a basic ${statistic[0].toUpperCase()}${statistic.slice(1)} save.`;
    const baseRank = Number(adapted.rank) || 1;
    const formula = heightened ? `(${dice}+floor((@item.rank - ${baseRank})/${Number(heightened[1])})*${Number(heightened[2])})d${die}[untyped]` : `${dice}d${die}[untyped]`;
    const claimed = [...lead, ...Object.values(options).map(option => option.sourceText)];
    return {
        html: `<p>${canonical}</p>${cut < 0 ? "" : `<hr />${html.slice(cut)}`}`,
        component: { id: "text-damage", formula: `${dice}d${die}`, type: "untyped", category: null, applyModifier: false, kinds: ["damage"], materials: [] },
        formula, options, choiceLabel: noun[0].toUpperCase() + noun.slice(1), claimed,
        note: `PF2e's item has no damage entry; the damage is read from the text (“${lead[damageAt]}”), of the type the chosen ${noun} deals.`
    };
}
