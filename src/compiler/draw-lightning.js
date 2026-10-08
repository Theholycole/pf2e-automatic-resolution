// A bolt that charges the caster's weapon (Draw the Lightning): "… You must hold your weapon or an empty hand aloft as part of Casting this Spell. When you
// do, a bolt of lightning descends from a storm cloud in the air above you and through the target, dealing 3d12 electricity damage with a basic Reflex save.
// For the rest of the spell's duration, your first Strike each round with the weapon you held aloft (or with your unarmed attacks if you held an empty hand
// aloft) deals an additional 1d12 electricity damage." / "… If draw the lightning is cast outside under a cloudy or stormy sky, increase the bolt's damage by
// @Damage[2d12[electricity]]." with PF2e's Spell Effect, target "1 creature that is either taller than you or higher than you" and "Heightened (8th) The
// damage dealt to the initial target increases by 4d12, and the additional damage dealt on the first Strike each turn increases by 1d12.": the target's
// basic save (the GM confirms it's taller or higher); the caster's answer whether the sky is cloudy or stormy (2d12 more); PF2e's Effect on the caster
// (its weapon choice and toggle for the first Strike each round); holding it aloft a reminder.
import { htmlToPlainText } from "./description-parser.js";
import { casterRowEffectMatches } from "./caster-row-effect.js";
import { SPELL_EFFECT_LINK_ANY as LINK, NARRATION_RULES } from "./text-patterns.js";

const ALOFT = /^You must hold your weapon or an empty hand aloft as part of Casting this Spell\.$/;
const BOLT = /^When you do, a bolt of lightning descends from a storm cloud in the air above you and through the target, dealing (\d+d\d+) ([a-z]+) damage with a basic (Fortitude|Reflex|Will) save\.$/;
const CHARGE = /^For the rest of the spell's duration, your first Strike each round with the weapon you held aloft \(or with your unarmed attacks if you held an empty hand aloft\) deals an additional 1d(\d+) ([a-z]+) damage\.$/;
const STORM = /^If [a-z ]+ is cast outside under a cloudy or stormy sky, increase the bolt's damage by @Damage\[(\d+)d(\d+)\[([a-z]+)\]\]\.$/;
const TARGET = /^1 creature that is either (taller than you or higher than you)$/;
const STEP = /^Heightened \((\d)th\) The damage dealt to the initial target increases by (\d+d\d+), and the additional damage dealt on the first Strike each turn increases by 1d(\d+)\.$/;

/** {html, target, predicate, upgrade, effect(links), reminder, sentences} or null. */
export function rewriteDrawLightning(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area) return null;
    const target = TARGET.exec(String(adapted.targeting?.target ?? "").trim());
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!target || rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 3 || !LINK.test(paragraphs[2])) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/), second = paragraphs[1].split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const bolt = BOLT.exec(first[2] ?? ""), charge = CHARGE.exec(first[3] ?? ""), storm = STORM.exec(second[1] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (first.length !== 4 || NARRATION_RULES.test(first[0]) || !ALOFT.test(first[1]) || !bolt || !charge || second.length !== 2 || NARRATION_RULES.test(second[0]) || !storm || !step) return null;
    const [, formula, type, statistic] = bolt;
    if (components.length !== 1 || components[0].category || String(components[0].formula).replace(/\s+/g, "") !== formula || String(components[0].type).toLowerCase() !== type
        || statistic.toLowerCase() !== adapted.defense.statistic || charge[2] !== type || storm[3] !== type || step[3] !== charge[1]) return null;
    const claim = { kind: "weapon-cast", damageType: type, dieSize: `d${charge[1]}`, dice: 1, heightened: { rank: Number(step[1]), dice: 2 }, duration: { value: 1, unit: "minutes" } };
    return {
        html: `<p>${first[0]} The target takes ${formula} ${type} damage with a basic ${statistic} save.</p><p>${paragraphs[2]}</p><hr /><p><strong>Heightened (${step[1]}th)</strong> The damage increases by ${step[2]}.</p>`,
        target: "1 creature",
        predicate: { kind: "gm-confirmed", question: `Is the target ${target[1]}? Only such a creature can be the target.`, sourceText: adapted.targeting.target },
        upgrade: { question: "Is the spell cast outside under a cloudy or stormy sky? If so, the bolt deals 2d12 more electricity damage.", adds: { dice: { count: Number(storm[1]), faces: Number(storm[2]), type }, persistent: null }, sourceText: second[1] },
        effect: links => {
            const [link] = links;
            if (links.length !== 1 || link.resolutionStatus !== "resolved" || !casterRowEffectMatches(link.document?.mechanics, claim)) return null;
            return { degrees: ["criticalSuccess", "success", "failure", "criticalFailure"], uuid: link.uuid, reference: link.reference, document: structuredClone(link.document), ...claim, claimText: first[3] };
        },
        reminder: { kind: "spell-note", text: `${first[1]} PF2e's Effect asks which weapon (an unarmed attack for an empty hand); toggle it for the first Strike each round.`, sourceText: first[1] },
        sentences: [...first, ...second, paragraphs[2], htmlToPlainText(heightened).trim(), adapted.targeting.target]
    };
}
