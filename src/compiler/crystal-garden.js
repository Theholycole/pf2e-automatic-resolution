// Crystals grown around the caster (Garden of Crystals): "You cause crystals to grow from the ground around you. The area becomes difficult terrain, though you can
// ignore it. Select three 5-foot bursts at least partially within the area; enormous clusters of crystals grow here, filled with magic energy. These crystalline
// structures are 10 feet high and occupy the area, moving any creatures in the area to the nearest adjacent space. When standing adjacent to one of these clusters,
// creatures' critical hits are empowered, dealing 1d10 force damage." with "Heightened (+2) The force damage increases by 1d10.": the emanation's difficult terrain
// (the caster's exemption a reminder); the three bursts the caster places — each cluster's squares walled off, any creature in them moved to the nearest free
// adjacent space; a creature adjacent to a cluster holds the critical force dice (the module's Effect checked against the text at every rank); no duration — the
// crystals stay until the GM ends the spell.
import { htmlToPlainText } from "./description-parser.js";
import { DOMAIN, ITEM_LINK as LINK, WORD_NUMBERS_2_4 as NUMBER } from "./text-patterns.js";

const LEAD = /^You cause crystals to grow from the ground around you\.$/;
const TERRAIN = /^(The area becomes difficult terrain), (though you can ignore it)\.$/;
const CLUSTERS = /^Select (three|two|four) @Template\[burst\|distance:(\d+)\]s at least partially within the area; enormous clusters of crystals grow here, filled with magic energy\.$/;
const OCCUPY = /^These crystalline structures are (\d+) feet high and occupy the area, moving any creatures in the area to the nearest adjacent space\.$/;
const CRIT = /^When standing adjacent to one of these clusters, creatures['’] critical hits are empowered, dealing (\d+)d(\d+) ([a-z]+) damage\.$/;
const STEP = /^Heightened \(\+(\d)\) The \3 damage increases by (\d+)d\2\.$/;

/** Dice at a rank. */
export function gardenDice(crit, rank) {
    return crit.dice + Math.max(0, Math.floor((Number(rank) - crit.baseRank) / crit.interval)) * crit.add;
}

/** {garden, sentences} or null. */
export function extractCrystalGarden(item, catalog = null) {
    const area = item?.system?.area;
    if (area?.type !== "emanation" || String(item.system?.duration?.value ?? "").trim() || item.system?.duration?.sustained || item.system?.defense || Object.keys(item.system?.damage ?? {}).length) return null;
    const [domain, body, heightened = "", ...rest] = String(item.system?.description?.value ?? "").split(/<hr\s*\/?>/i);
    if (rest.length) return null;
    const domainMatch = DOMAIN.exec(String(/<p>([\s\S]*?)<\/p>/.exec(domain)?.[1] ?? "").trim());
    const sentences = htmlToPlainText(String(/<p>([\s\S]*?)<\/p>/.exec(body)?.[1] ?? "")).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/);
    const [stepHTML, linkHTML] = [...heightened.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    const terrain = TERRAIN.exec(sentences[1] ?? ""), clusters = CLUSTERS.exec(sentences[2] ?? ""), occupy = OCCUPY.exec(sentences[3] ?? ""), crit = CRIT.exec(sentences[4] ?? "");
    const step = crit ? new RegExp(STEP.source.replace("\\3", crit[3]).replace("\\2", `d${crit[2]}`).replace("dd", "d")).exec(htmlToPlainText(stepHTML ?? "").replace(/\s+/g, " ").trim()) : null;
    const link = LINK.exec(linkHTML ?? "");
    if (!domainMatch || sentences.length !== 5 || !LEAD.test(sentences[0]) || !terrain || !clusters || !occupy || !crit || !step || !link) return null;
    const baseRank = Number(item.system?.level?.value ?? 1);
    const garden = { radius: Number(area.value), clusters: { count: NUMBER[clusters[1]], burst: Number(clusters[2]), height: Number(occupy[1]) },
        crit: { dice: Number(crit[1]), die: `d${crit[2]}`, type: crit[3], baseRank, interval: Number(step[1]), add: Number(step[2]) },
        exemption: `${terrain[1]}, ${terrain[2]}.`, effect: { uuid: link[1], name: link[3] }, sourceText: sentences.slice(1) };
    // (The module's Effect: critical-only force dice on Strikes, spells and impulses, its count the text's at every rank.)
    const effect = catalog?.get?.(link[2]) ?? null, rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [];
    const dice = rules.length === 1 && rules[0].key === "DamageDice" ? rules[0] : null;
    if (!dice || dice.critical !== true || dice.dieSize !== garden.crit.die || dice.damageType !== garden.crit.type || ![...[dice.selector].flat()].includes("strike-damage")) return null;
    for (let rank = baseRank; rank <= 10; rank++) {
        const formula = String(dice.diceNumber).replace(/@item\.(?:level|rank)\b/g, String(rank));
        if (!/^[\d\s()+*\/-]*$/.test(formula.replace(/ceil|floor/g, ""))) return null;
        let count;
        try { count = Function(`"use strict"; const ceil = Math.ceil, floor = Math.floor; return (${formula});`)(); } catch { return null; }
        if (count !== gardenDice(garden.crit, rank)) return null;
    }
    garden.selectors = [dice.selector].flat();
    return { garden, sentences: [...sentences.slice(1), htmlToPlainText(stepHTML).trim()] };
}
