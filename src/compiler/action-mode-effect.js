// A spell whose action count sets its range and targets, with PF2e's Effect keyed to that count (Spirit Ward):
//   "You grant the target a +1 status bonus to saving throws against spells and effects caused by creatures that have the spirit trait and
//   haunts." / "The number of actions you spend when Casting this Spell determines its targets, range, area, and other parameters." then
//   [1] "The spell has a range of touch." [2] "(concentrate) The spell has a range of 30 feet. If you target a living creature, the bonus
//   increases to +2." [3] "(concentrate) You create a ward in a @Template[type:emanation|distance:30]. This targets you and all your allies in
//   the burst." with PF2e's Effect (an action-count ChoiceSet, the +1 status bonus, and an upgrade to +2 for a living creature at 2 actions).
// Casting asks for the action count (or takes it): 1 touches one creature, 2 targets one creature within the range, 3 wards the caster and
// every ally in the emanation. PF2e's Effect goes on each with the action count selected; the cast is a sustained Ongoing record (a missed
// Sustain ends it). PF2e's bonus also covers every spell; the module's Effect keeps only spirit and haunt origins, as the text says.
import { htmlToPlainText } from "./description-parser.js";
import { DETERMINES, NARRATION_RULES_TIMED as NARRATION_RULES, TOUCH } from "./text-patterns.js";

const BONUS = /^You grant the target a \+(\d) status bonus to saving throws against spells and effects caused by creatures that have the ([a-z]+) trait and haunts\.$/;
const MODE = /^<span class="action-glyph">([123])<\/span>\s*(?:\(concentrate\)\s*)?([\s\S]+)$/;
const RANGED = /^The spell has a range of (\d+) feet\. If you target a living creature, the bonus increases to \+(\d)\.$/;
const WARD = /^You create a ward in a @Template\[type:emanation\|distance:(\d+)\]\. This targets you and all your allies in the burst\.$/;

/** Returns {actionModeEffect, claimed} or null. */
export function compileActionModeEffect(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || adapted.targeting?.area || adapted.lifecycle?.sustained !== true) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || !/^1 to 3$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const html = String(adapted.descriptionHTML ?? "");
    if (/<hr\b/i.test(html)) return null;
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 5 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[4])) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => BONUS.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 2 || !DETERMINES.test(sentences[at + 1]) || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const bonus = BONUS.exec(sentences[at]);
    const modes = paragraphs.slice(1, 4).map(paragraph => MODE.exec(paragraph));
    if (modes.some((mode, index) => !mode || Number(mode[1]) !== index + 1)) return null;
    const texts = modes.map(mode => htmlToPlainText(`<p>${mode[2]}</p>`).replace(/\s+/g, " ").trim());
    const ranged = RANGED.exec(texts[1]), ward = WARD.exec(texts[2].replace(/\s+/g, " "));
    const wardRaw = WARD.exec(modes[2][2].replace(/\s+/g, " ").trim());
    if (!TOUCH.test(texts[0]) || !ranged || !(ward || wardRaw)) return null;
    // PF2e's Effect: the action-count choice, the stated bonus, and the living upgrade at 2 actions.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const choice = rules.find(rule => rule.key === "ChoiceSet"), flat = rules.find(rule => rule.key === "FlatModifier"), upgrade = rules.find(rule => rule.key === "AdjustModifier");
    if (rules.length !== 3 || choice?.choices?.config !== "actionsNumber" || !choice.rollOption) return null;
    if (!(flat?.selector === "saving-throw" && flat.type === "status" && Number(flat.value) === Number(bonus[1]))) return null;
    if (!(upgrade?.mode === "upgrade" && upgrade.selector === "saving-throw" && Number(upgrade.value) === Number(ranged[2])
        && JSON.stringify([...(upgrade.predicate ?? [])].sort()) === JSON.stringify(["self:mode:living", `${choice.rollOption}:2`].sort()))) return null;
    // "against spells and effects caused by creatures that have the spirit trait and haunts": PF2e's predicate also takes every spell
    // (`item:type:spell`); the module's Effect keeps only the origins the text names (user decision).
    const any = (flat.predicate ?? []).length === 1 ? flat.predicate[0]?.or : null;
    const origins = [`origin:trait:${bonus[2]}`, "origin:trait:haunt"].sort();
    if (!Array.isArray(any) || JSON.stringify(any.filter(option => option !== "item:type:spell").sort()) !== JSON.stringify(origins)) return null;
    const broad = any.includes("item:type:spell");
    return {
        actionModeEffect: {
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, choiceRuleIndex: rules.indexOf(choice),
            modes: { 1: { range: "touch", targets: "one" }, 2: { rangeFeet: Number(ranged[1]), targets: "one", livingBonus: Number(ranged[2]) }, 3: { emanation: Number((ward ?? wardRaw)[1]), targets: "self-and-allies" } },
            durationSeconds: Number(minutes[1]) * 60, sustained: true,
            ...(broad ? { ruleOverrides: [{ index: rules.indexOf(flat), key: "FlatModifier", patch: { predicate: [{ or: origins }] } }] } : {})
        },
        claimed: [...sentences, ...texts]
    };
}

export function isExecutableActionModeEffect(data) {
    return Boolean(data) && typeof data.effect?.uuid === "string" && Number.isInteger(data.choiceRuleIndex) && data.modes?.[1]?.range === "touch"
        && Number.isInteger(data.modes?.[2]?.rangeFeet) && Number.isInteger(data.modes?.[3]?.emanation) && Number.isInteger(data.durationSeconds) && data.durationSeconds > 0;
}
