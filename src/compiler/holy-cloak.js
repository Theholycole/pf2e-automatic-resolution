// Holy light that heals the living beside the caster and burns undead (Cloak of Light): "You surround yourself in holy light that restores the living and
// rebuffs undead. You glow with bright light in a 30-foot radius and dim light to the next 30 feet. Living creatures that begin their turn adjacent to you
// recover 4d6 Hit Points. Undead creatures that begin their turn adjacent to you take 4d6 vitality damage (basic Fortitude save)." with "Heightened (+2) The
// healing increases by 2d6, and the damage to undead increases by 2d6.": a sustained 5-foot emanation around the caster (adjacent), the caster out of it,
// whose creatures are exposed as their turns begin — Heal's dual mode: a living creature regains the roll, an undead one saves against it (PF2e's one
// vitality entry, heightened); the caster's light a TokenLight Effect for the spell.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES } from "./text-patterns.js";

const GLOW = /^You glow with bright light in a (\d+)-foot radius and dim light to the next (\d+) feet\.$/;
const LIVING = /^Living creatures that begin their turn adjacent to you recover (\d+d\d+) Hit Points\.$/;
const UNDEAD = /^Undead creatures that begin their turn adjacent to you take (\d+d\d+) ([a-z]+) damage \(basic (Fortitude|Reflex|Will) save\)\.$/;
const STEP = /^Heightened \(\+(\d)\) The healing increases by (\d+d\d+), and the damage to undead increases by \2\.$/;

/** {html, area, light, sentences} or null. */
export function rewriteHolyCloak(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || adapted.targeting?.area || adapted.lifecycle?.sustained !== true || String(adapted.targeting?.target ?? "").trim()) return null;
    const components = adapted.damageComponents ?? [];
    const [body, heightened = "", ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const glow = GLOW.exec(sentences[1] ?? ""), living = LIVING.exec(sentences[2] ?? ""), undead = UNDEAD.exec(sentences[3] ?? ""), step = STEP.exec(htmlToPlainText(heightened).replace(/\s+/g, " ").trim());
    if (sentences.length !== 4 || NARRATION_RULES.test(sentences[0]) || !glow || !living || !undead || !step) return null;
    const [, formula, type, statistic] = undead;
    if (components.length !== 1 || components[0].category || JSON.stringify(components[0].kinds) !== '["damage","healing"]' || String(components[0].formula).replace(/\s+/g, "") !== formula
        || living[1] !== formula || String(components[0].type).toLowerCase() !== type || type !== "vitality" || statistic.toLowerCase() !== adapted.defense.statistic) return null;
    return {
        html: `<p>${sentences[0]} A creature that starts its turn in the area takes ${formula} ${type} damage with a basic ${statistic} save.</p><hr /><p><strong>Heightened (+${step[1]})</strong> The damage increases by ${step[2]}.</p>`,
        area: { type: "emanation", value: 5 },
        energy: type,
        light: { bright: Number(glow[1]), dim: Number(glow[1]) + Number(glow[2]), sourceText: sentences[1] },
        sentences: [...sentences, htmlToPlainText(heightened).trim()]
    };
}
