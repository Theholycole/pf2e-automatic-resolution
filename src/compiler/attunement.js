// A spell that heals the living and harms the undead, again at the end of each of the caster's turns (Positive Attunement), cast as its PF2e
// variants: "… If the creature is living, it heals 1d8 Hit Points immediately and at the end of each of your turns. Effects that increase
// healing only increase the initial healing." / "If the creature is undead or has void healing, it instead takes 1d8 vitality damage, depending on
// the result of its Will save." with rows "Success The creature is damaged once and the spell ends." / "Failure The creature is damaged immediately
// and at the end of each of your turns (so twice in the round you Cast the Spell)." / "Critical Failure As failure, and the damage is doubled."
// and "Heightened (+3) The damage and healing each increase by 1d8."
// The healing variant heals a living target now and at the end of each of the caster's turns while it's Sustained (a note: only the first
// healing is increased by healing boosts); the damage variant is the Will save on an undead (or void-healing) target, its failing rows starting
// the same turn-end damage (doubled after a critical failure).
import { htmlToPlainText } from "./description-parser.js";

const HEAL = /^If the creature is living, it heals (\d+d\d+) Hit Points immediately and at the end of each of your turns\.$/;
const BOOST = /^Effects that increase healing only increase the initial healing\.$/;
const HARM = /^If the creature is undead or has void healing, it instead takes (\d+d\d+) ([a-z]+) damage, depending on the result of its (Fortitude|Reflex|Will) save\.$/;
const ROWS = {
    criticalSuccess: /^The creature is unaffected\.$/,
    success: /^The creature is damaged once and the spell ends\.$/,
    failure: /^The creature is damaged immediately and at the end of each of your turns \(so twice in the round you Cast the Spell\)\.$/,
    criticalFailure: /^As failure, and the damage is doubled\.$/
};
const STEP = /^Heightened \(\+(\d)\) The damage and healing each increase by (\d+d\d+)\.$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|heals?)\b/i;
const DEGREES = [["criticalSuccess", "Critical Success"], ["success", "Success"], ["failure", "Failure"], ["criticalFailure", "Critical Failure"]];

function read(adapted) {
    if (!/^(?:1|one) living or undead creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.lifecycle?.sustained !== true) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const [intro, table, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (!minutes || !table || rest.length) return null;
    const paragraphs = [...intro.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => htmlToPlainText(match[1]).replace(/\s+/g, " ").trim());
    if (paragraphs.length !== 2) return null;
    const first = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const at = first.findIndex(sentence => HEAL.test(sentence));
    if (at < 0 || first.length !== at + 2 || !BOOST.test(first[at + 1]) || first.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const harm = HARM.exec(paragraphs[1]);
    const step = STEP.exec(htmlToPlainText(heightened ?? "").replace(/\s+/g, " ").trim());
    if (!harm || !step || HEAL.exec(first[at])[1] !== harm[1]) return null;
    const written = [];
    for (const [degree, heading] of DEGREES) {
        const row = new RegExp(String.raw`<p>\s*<strong>\s*${heading}\s*<\/strong>([\s\S]*?)<\/p>`, "i").exec(table);
        const text = row ? htmlToPlainText(row[1]).replace(/\s+/g, " ").trim() : "";
        if (!ROWS[degree].test(text)) return null;
        written.push(`${heading} ${text}`);
    }
    return { dice: harm[1], type: harm[2], statistic: harm[3], step: { interval: Number(step[1]), dice: step[2] }, durationSeconds: Number(minutes[1]) * 60,
        heal: first[at], boost: first[at + 1], harm: paragraphs[1], rows: written, narration: first.slice(0, at), heightened: htmlToPlainText(heightened).trim() };
}

/** The healing variant (no save): {turnHealing, claimed} or null. */
export function compileAttunementHealing(adapted) {
    if ((adapted.defense?.kind ?? "none") !== "none") return null;
    const components = adapted.damageComponents ?? [];
    const found = read(adapted);
    if (!found || components.length !== 1 || !components[0].kinds?.includes("healing") || String(components[0].formula).replace(/\s+/g, "") !== found.dice) return null;
    if (adapted.heightening?.type !== "interval" || Number(adapted.heightening.interval) !== found.step.interval || adapted.heightening.damage?.[components[0].id] !== found.step.dice) return null;
    return {
        turnHealing: { targets: 1, componentId: components[0].id, formula: components[0].formula, durationSeconds: found.durationSeconds, immediate: true, events: ["source-turn-end"],
            sustained: true, living: true, endsForHostile: null, boostNote: found.boost, sourceText: found.heal },
        claimed: [...found.narration, found.heal, found.boost, found.harm, ...found.rows, found.heightened]
    };
}

/** The damage variant (the Will save): {html, target, turnHazard, claimed} or null. */
export function rewriteAttunementDamage(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== false) return null;
    const components = adapted.damageComponents ?? [];
    const found = read(adapted);
    if (!found || found.statistic.toLowerCase() !== adapted.defense.statistic || components.length !== 1 || components[0].category
        || String(components[0].formula).replace(/\s+/g, "") !== found.dice || String(components[0].type).toLowerCase() !== found.type) return null;
    return {
        html: `<p>The creature takes ${found.dice} ${found.type} damage, depending on its ${found.statistic} save.</p><hr /><p><strong>Critical Success</strong> The creature is unaffected.</p>`
            + `<p><strong>Success</strong> The creature takes full damage.</p><p><strong>Failure</strong> The creature takes full damage.</p><p><strong>Critical Failure</strong> The creature takes double damage.</p>`
            + `<hr /><p><strong>Heightened (+${found.step.interval})</strong> The damage increases by ${found.step.dice}.</p>`,
        target: "1 creature that is undead or has void healing",
        turnHazard: { events: ["source-turn-end"], multipliers: { failure: 1, criticalFailure: 2 }, sustained: true, durationSeconds: found.durationSeconds, type: found.type, sourceText: found.rows[2] },
        claimed: [...found.narration, found.heal, found.boost, found.harm, ...found.rows, found.heightened]
    };
}
