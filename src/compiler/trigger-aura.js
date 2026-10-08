// An aura that hurts the foes in it when something else takes hold of them (Overwhelming Festivities): "When an enemy in the emanation fails a save against an
// emotion effect or gains the frightened condition from an effect, it also takes 3d4 persistent mental damage." with the module's Aura Effect and "Heightened (+2)
// The persistent damage increases by 1d4 and the radius of the emanation increases by 5 feet.": the module's Aura on the caster (its radius the text's at each
// rank, its Effect on enemies), and the module watching: an enemy holding the aura's Effect that fails a save with the emotion trait, or newly becomes
// Frightened, takes the text's persistent damage at the cast rank.
import { htmlToPlainText } from "./description-parser.js";

const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|terrain)\b/i;
const TRIGGER = /^When an enemy in the emanation fails a save against an? ([a-z]+) effect or gains the ([a-z]+) condition from an effect, it also takes (\d+)d(\d+) persistent ([a-z]+) damage\.$/;
const STEP = /^Heightened \(\+(\d)\) The persistent damage increases by 1d(\d+) and the radius of the emanation increases by (\d+) feet\.$/;
const LINK = /^@UUID\[(Compendium\.[A-Za-z0-9_.-]+\.Item\.([A-Za-z0-9]{16}))\]\{([^}]+)\}$/;

/** The module's Aura matches the text: its radius at each rank the text's, its one Effect on enemies. */
export function auraRadiusAt(radius, rank) {
    const formula = String(radius).replace(/@item\.(?:level|rank)\b/g, String(rank));
    if (!/^[\d\s()+*\/-]*(?:ceil|floor)?[\d\s()+*\/-]*$/.test(formula.replace(/ceil|floor/g, ""))) return null;
    try { return Function(`"use strict"; const ceil = Math.ceil, floor = Math.floor; return (${formula});`)(); } catch { return null; }
}

/** {trigger, sentences} or null. */
export function extractTriggerAura(adapted, catalog = null) {
    const area = adapted.targeting?.area;
    if (area?.type !== "emanation" || adapted.defense?.kind === "save" || String(adapted.targeting?.target ?? "").trim() || !/^1 minute$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    const lead = (paragraphs[0] ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const trigger = TRIGGER.exec(lead[1] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim()), link = LINK.exec(paragraphs[1] ?? "");
    if (paragraphs.length !== 2 || lead.length !== 2 || NARRATION_RULES.test(lead[0]) || !trigger || !step || !link || trigger[4] !== step[2]) return null;
    const components = adapted.damageComponents ?? [], baseRank = Number(adapted.rank) || 1, interval = Number(step[1]), feet = Number(step[3]);
    if (components.length !== 1 || String(components[0].formula).replace(/\s+/g, "") !== `${trigger[3]}d${trigger[4]}` || components[0].type !== trigger[5]) return null;
    // (The module's Aura: its radius the text's at each rank, its one Effect for enemies.)
    const effect = catalog?.get?.(link[2]) ?? null, rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [];
    const aura = rules.length === 1 && rules[0].key === "Aura" ? rules[0] : null;
    if (!aura || (aura.effects ?? []).length !== 1 || aura.effects[0].affects !== "enemies") return null;
    for (let rank = baseRank; rank <= 10; rank++) if (auraRadiusAt(aura.radius, rank) !== Number(area.value) + Math.floor((rank - baseRank) / interval) * feet) return null;
    return {
        trigger: { effect: { uuid: link[1], name: link[3] }, granted: aura.effects[0].uuid, trait: trigger[1], condition: trigger[2],
            formula: `(${trigger[3]}+floor((@item.rank - ${baseRank})/${interval}))d${trigger[4]}`, type: trigger[5], persistent: true, seconds: 60,
            radius: { base: Number(area.value), baseRank, interval, feet }, sourceText: lead[1] },
        sentences: [lead[1], htmlToPlainText(heightened).trim()]
    };
}
