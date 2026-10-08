// A check against the target's DC that readies extra damage against it (Ki Cutting Sight): "When you Cast the Spell, make a
// @Check[perception|defense:fortitude] check against the target's Fortitude DC. If you succeed, the next time you deal damage to the target with a
// Strike or ki spell, you deal 4d10 additional slashing damage." with PF2e's Effect (a damage toggle and DamageDice "@item.level + 1" d10 slashing on a
// Strike or a monk focus spell) and "Heightened (+1) The slashing damage increases by 1d10."
// The cast rolls the caster's check against the targeted creature's DC; on a success, PF2e's Effect goes on the caster with the toggle replaced by a
// mark on that creature (the dice only against it — the text over the data), removed after the first damage roll against it that adds the dice.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK_LABEL as LINK } from "./text-patterns.js";

// Organsight: "For the duration, you gain a +2 circumstance bonus on Medicine checks against the target that depend on its organs, but a -2
// circumstance penalty on Medicine checks depending on seeing its skin." / "When you Cast the Spell, attempt a special Recall Knowledge check using
// Medicine to spot and discern a vital organ. If you have a Lore skill appropriate to the creature, you can use that skill instead of Medicine. If you
// succeed, the next time you deal piercing or slashing damage to the target with a Strike or spell, you deal 4d6 additional precision damage. Once on
// each of your subsequent turns, you can use a single action to attempt the special Recall Knowledge check again. The extra damage isn't cumulative,
// …" with PF2e's Effect (the two Medicine modifiers on roll options, a damage toggle, DamageDice "1 + @item.level" d6 precision on piercing or slashing
// Strike or spell damage): PF2e's Effect for the duration (toggles for the two kinds of Medicine check); the Recall Knowledge (Medicine or a Lore,
// against the creature's level DC) marks the creature on a success, and the first piercing or slashing damage roll against it removes the mark; the
// card's control repeats the check once on each later turn.
const ORGANS = /^For the duration, you gain a \+(\d) circumstance bonus on Medicine checks against the target that depend on its organs, but a [-–−](\d) circumstance penalty on Medicine checks depending on seeing its skin\.$/;
const RECALL = /^When you Cast the Spell, attempt a special Recall Knowledge check using (Medicine) to spot and discern a vital organ\.$/;
const LORE = /^If you have a Lore skill appropriate to the creature, you can use that skill instead of Medicine\.$/;
const NEXT = /^If you succeed, the next time you deal (piercing) or (slashing) damage to the target with a Strike or spell, you deal (\d+)d(\d+) additional (precision) damage\.$/;
const AGAIN = /^Once on each of your subsequent turns, you can use a single action to attempt the special Recall Knowledge check again\.$/;
const NOT_CUMULATIVE = /^The extra damage isn't cumulative, so making the check more than once before a Strike or spell has no extra benefit\.$/;
const ORGAN_STEP = /^Heightened \(\+1\) The (precision) damage increases by 1d(\d+)\.$/;

function organsight(adapted, catalog) {
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = LINK.exec(paragraphs.at(-1) ?? "");
    const sentences = paragraphs.slice(0, -1).flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const at = sentences.findIndex(sentence => ORGANS.test(sentence));
    if (!link || at < 0 || sentences.length !== at + 6 || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|DC)\b/i.test(sentence))) return null;
    const organs = ORGANS.exec(sentences[at]), next = NEXT.exec(sentences[at + 3]), step = ORGAN_STEP.exec(htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim());
    if (!RECALL.test(sentences[at + 1]) || !LORE.test(sentences[at + 2]) || !next || !AGAIN.test(sentences[at + 4]) || !NOT_CUMULATIVE.test(sentences[at + 5]) || !step || step[2] !== next[4]) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2] || entry?.id === link[1]);
    const rules = effect?.mechanics?.rules ?? [];
    const toggle = rules.find(rule => rule.key === "RollOption"), dice = rules.find(rule => rule.key === "DamageDice");
    const mods = rules.filter(rule => rule.key === "FlatModifier");
    const rank = Number(adapted.rank);
    const bonus = mods.find(rule => rule.value === Number(organs[1])), penalty = mods.find(rule => rule.value === -Number(organs[2]));
    if (!effect?.id || rules.length !== 4 || toggle?.toggleable !== true || toggle.domain !== "damage" || dice?.category !== next[5] || dice.dieSize !== `d${next[4]}`
        || String(dice.diceNumber).replace(/\s+/g, "") !== `${Number(next[3]) - rank}+@item.level` || !(dice.predicate ?? []).includes(toggle.option)
        || !bonus || !penalty || bonus.selector !== "medicine" || penalty.selector !== "medicine" || bonus.type !== "circumstance" || penalty.type !== "circumstance"
        || (bonus.predicate ?? []).length !== 1 || (penalty.predicate ?? []).length !== 1) return null;
    return { checkMark: { statistic: "recall-knowledge", skill: next ? "medicine" : null, lore: true, against: "level-dc", effect: { uuid: `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name },
        option: toggle.option, markSlug: toggle.option, trigger: "Strike or spell", persistent: true, damageTypes: [next[1], next[2]], repeat: "once-per-later-turn",
        toggles: [{ option: bonus.predicate[0], label: "Medicine check that depends on its organs" }, { option: penalty.predicate[0], label: "Medicine check that depends on seeing its skin" }] },
        claimed: [...sentences, link[0]] };
}

const CHECK = /^When you Cast the Spell, make a @Check\[(perception|[a-z]+)\|defense:(fortitude|reflex|will)\] check against the target's (Fortitude|Reflex|Will) DC\.$/;
const SUCCEED = /^If you succeed, the next time you deal damage to the target with a Strike or ([a-z]+) spell, you deal (\d+)d(\d+) additional ([a-z]+) damage\.$/;
const STEP = /^Heightened \(\+1\) The ([a-z]+) damage increases by 1d(\d+)\.$/;

/** {checkMark, claimed} or null; the catalog proves PF2e's Effect. */
export function compileCheckMark(adapted, catalog) {
    if (/^1 living or undead creature that has organs$/i.test(String(adapted.targeting?.target ?? "").trim())) return organsight(adapted, catalog);
    if ((adapted.defense?.kind ?? "none") !== "none" || (adapted.damageComponents ?? []).length || !/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim())) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].replace(/\s+/g, " ").trim());
    const link = LINK.exec(paragraphs.at(-1) ?? "");
    const sentences = paragraphs.slice(0, -1).flatMap(paragraph => htmlToPlainText(paragraph).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/)).filter(Boolean);
    const at = sentences.findIndex(sentence => CHECK.test(sentence));
    const heightened = htmlToPlainText(rest.join(" ")).replace(/\s+/g, " ").trim();
    const step = STEP.exec(heightened);
    if (!link || at < 0 || sentences.length !== at + 2 || (heightened && !step) || sentences.slice(0, at).some(sentence => /\d|@|\b(?:damage|saves?|bonus|penalty|DC)\b/i.test(sentence))) return null;
    const check = CHECK.exec(sentences[at]), success = SUCCEED.exec(sentences[at + 1]);
    if (!success || check[2] !== check[3].toLowerCase() || (step && (step[1] !== success[4] || step[2] !== success[3]))) return null;
    const entries = catalog instanceof Map ? [...catalog.values()] : Object.values(catalog ?? {});
    const effect = entries.find(entry => entry?.name === link[2] || entry?.id === link[1]);
    const rules = effect?.mechanics?.rules ?? [];
    const toggle = rules.find(rule => rule.key === "RollOption"), dice = rules.find(rule => rule.key === "DamageDice");
    // (At the spell's rank, "@item.level + 1" dice: 4 at 3rd, one more a rank — the text's 4d10 and its Heightened (+1).)
    const rank = Number(adapted.rank);
    if (!effect?.id || rules.length !== 2 || toggle?.toggleable !== true || toggle.domain !== "damage" || dice?.damageType !== success[4] || dice.dieSize !== `d${success[3]}` || dice.selector !== "damage"
        || String(dice.diceNumber).replace(/\s+/g, "") !== `@item.level+${Number(success[2]) - rank}` || !step || !(dice.predicate ?? []).includes(toggle.option)) return null;
    return { checkMark: { statistic: check[1], against: check[2], effect: { uuid: effect.uuid ?? `Compendium.pf2e.spell-effects.Item.${effect.id}`, name: effect.name }, option: toggle.option, markSlug: toggle.option, trigger: `Strike or ${success[1]} spell` },
        claimed: [...sentences, link[0], heightened] };
}
