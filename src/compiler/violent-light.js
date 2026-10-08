// An ally's damaging light that grows on Sustain (Aura of Violent Light): "The creature radiates bright light in an aura with a 5-foot emanation (and dim
// light for the next 5 feet). On subsequent turns, the first time each round you Sustain the spell, you increase the emanation by 5 feet up to a maximum of
// 15 feet." and "While illuminated, the ally radiates powerful energy that deals @Damage[(1+@item.level)[fire],(1+@item.level)[spirit]] damage to all
// enemies that end their turn within the bright light of the emanation (basic Fortitude save).": the willing ally the cast targets is the aura's centre;
// an enemy ending its turn within the emanation saves (the item's damage, heightened), the radius 5 feet larger on the first Sustain each round up to its
// maximum; the module's Effect on the ally (its Aura rule's radius 5 × its badge, the badge's labels the text's radii) raised with it.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const LIGHT = /^The creature radiates bright light in an aura with a (\d+)-foot emanation \(and dim light for the next (\d+) feet\)\.$/;
const GROW = /^On subsequent turns, the first time each round you Sustain the spell, you increase the emanation by (\d+) feet up to a maximum of (\d+) feet\.$/;
const DEAL = /^While illuminated, the ally radiates powerful energy that deals @Damage\[(.+)\] damage to all enemies that end their turn within the bright light of the emanation \(basic (Fortitude|Reflex|Will) save\)\.$/;
const STEP = /^Heightened \(\+1\) The ([a-z]+) and ([a-z]+) damage each increase by (\d+)\.$/;
const LINK = /^@UUID\[(Compendium\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.Item\.([A-Za-z0-9]{16}))\]\{([^}]+)\}$/;

/** The module's Effect matches the text: an Aura rule of 5 × its badge, the badge counting the text's radii, for the sustained minute. */
export function violentLightEffectMatches(effect, { feet, step, maximum }) {
    const rules = effect?.mechanics?.rules ?? effect?.system?.rules ?? [], badge = effect?.system?.badge ?? effect?.badge ?? null, duration = effect?.mechanics?.duration ?? effect?.system?.duration;
    const radii = [];
    for (let radius = feet; radius <= maximum; radius += step) radii.push(`${radius} feet`);
    return rules.length === 1 && rules[0].key === "Aura" && String(rules[0].radius).replace(/\s+/g, "") === `${step}*@item.badge.value` && feet === step
        && (badge == null || (badge.type === "counter" && Number(badge.value) === 1 && JSON.stringify(badge.labels ?? radii) === JSON.stringify(radii)))
        && duration?.value === 1 && duration.unit === "minutes" && duration.sustained === true;
}

/** {html, lingering, anchorEffect, sentences} or null. */
export function rewriteViolentLight(adapted, catalog = null) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || !/^1 willing ally$/i.test(String(adapted.targeting?.target ?? "").trim())
        || adapted.lifecycle?.sustained !== true || !/^1 minute$/.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const tail = htmlToPlainText(heightened).split("\n").map(line => line.trim()).filter(Boolean);
    const light = LIGHT.exec(sentences[1] ?? ""), grow = GROW.exec(sentences[2] ?? ""), deal = DEAL.exec(sentences[3] ?? ""), step = STEP.exec(tail[0] ?? ""), link = LINK.exec(tail[1] ?? "");
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !light || !grow || !deal || !step || !link || tail.length !== 2) return null;
    const feet = Number(light[1]), by = Number(grow[1]), maximum = Number(grow[2]);
    if (feet % 5 || by % 5 || maximum <= feet || (maximum - feet) % by || deal[2].toLowerCase() !== adapted.defense.statistic) return null;
    // The text's dice are the item's: each part "(1+@item.level)" of its type, 2 at rank 1 rising by the stated 1 each rank.
    const parts = deal[1].split(",").map(part => /^\((\d+)\+@item\.level\)\[([a-z]+)\]$/.exec(part.trim()));
    const components = adapted.damageComponents ?? [], heightening = adapted.heightening ?? {};
    if (parts.some(part => !part) || parts.length !== components.length || components.length !== 2 || heightening.type !== "interval" || heightening.interval !== 1) return null;
    if (JSON.stringify(parts.map(part => part[2])) !== JSON.stringify([step[1], step[2]])) return null;
    for (const [index, component] of components.entries()) {
        const [, base, type] = parts[index];
        if (component.category || component.type !== type || Number(component.formula) !== Number(base) + Number(adapted.rank) || String(heightening.damage?.[component.id]) !== step[3]) return null;
    }
    const effect = catalog?.get?.(link[2]) ?? null;
    if (!effect || !violentLightEffectMatches(effect, { feet, step: by, maximum })) return null;
    const types = components.map(component => component.type);
    return {
        html: `<p>Each creature takes ${components.map(component => `${component.formula} ${component.type}`).join(" and ")} damage with a basic ${deal[2]} save.</p>`,
        lingering: { events: ["turn-end"], initial: false, oncePerRound: false, excludeCaster: true, enemiesOnly: true, area: null, centre: "targets", aura: { feet },
            auraGrowth: { feet: by, maximum, sourceText: sentences[2] }, anchorAlly: true,
            anchorEffect: { uuid: link[1], name: link[3] },
            durationSeconds: 60, sustained: true, concealment: false,
            notes: [`${sentences[1]} (The ally's light is the emanation: ${feet} feet now, ${by} more on the first Sustain each round to ${maximum}; dim light ${light[2]} feet beyond.)`],
            sourceText: [sentences[3]] },
        types,
        sentences: [...sentences, ...tail]
    };
}
