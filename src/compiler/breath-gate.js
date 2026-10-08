// A breath weapon gained by counteracting something first, used until the spell ends with a recharge (Swallow Light):
//   "Attempt a counteract check against the light effect." / "If you successfully counteract it, you gain a breath weapon of chilling shadows you
//   can use until the spell ends." / "Exhaling the breath is a two-action activity." / "The breath weapon is a 15-foot cone and deals 1d6 cold
//   damage plus 1d6 void damage." / "Creatures in the area can attempt a basic Reflex save against your spell DC." / "Once activated, you can't
//   use the breath weapon again for [[/r 1d4 #Rounds]] rounds." with "Heightened (+2) Increase the damage of the breath weapon by 1d6 cold
//   damage and 1d6 void damage."
// Rewritten to the ordinary basic save of the creatures in the cone, repeatable from the card while the spell lasts (window "duration", two
// actions) once the card's counteract check succeeds (the gate), and not again until the recharge's rounds have passed.
import { htmlToPlainText } from "./description-parser.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const COUNTER = /^Attempt a counteract check against the ([a-z ]+)\.$/;
const GAIN = /^If you successfully counteract it, you gain a breath weapon(?: of [a-z ]+)? you can use until the spell ends\.$/;
const ACTIONS = /^Exhaling the breath is a (two|three)-action activity\.$/;
const BREATH = /^The breath weapon is a (\d+)-foot (cone|line|burst|emanation) and deals (\d+d\d+) ([a-z]+) damage plus (\d+d\d+) ([a-z]+) damage\.$/;
const SAVE = /^Creatures in the area can attempt a basic (Fortitude|Reflex|Will) save against your spell DC\.$/;
const RECHARGE = /^Once activated, you can't use the breath weapon again for (?:\[\[\/r (\d+d\d+) #Rounds\]\]|(\d+d\d+)) rounds\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*Increase the damage of the breath weapon by (\d+d\d+) ([a-z]+) damage and (\d+d\d+) ([a-z]+) damage\.\s*<\/p>$/;

/** {html, repeatable, sentences} or null. */
export function extractBreathGate(adapted) {
    if (adapted.defense?.kind !== "save" || adapted.defense.basic !== true || !/^\d+ minutes?$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || adapted.lifecycle?.sustained) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 2 || components.some(component => component.category || component.applyModifier)) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = htmlToPlainText(body).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => COUNTER.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 6 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const counter = COUNTER.exec(sentences[at]), actions = ACTIONS.exec(sentences[at + 2]), breath = BREATH.exec(sentences[at + 3]), save = SAVE.exec(sentences[at + 4]), recharge = RECHARGE.exec(sentences[at + 5]);
    if (!GAIN.test(sentences[at + 1]) || !actions || !breath || !save || !recharge) return null;
    // The target is the thing counteracted ("1 magical light effect"), the area and save the item's, and the damage its two entries.
    if (!new RegExp(`^1 magical ${counter[1].replace(/^the /, "").replace(/ effect$/, "")} effect$`, "i").test(String(adapted.targeting?.target ?? "").trim())) return null;
    const area = adapted.targeting?.area;
    if (area?.type !== breath[2] || Number(area.value) !== Number(breath[1]) || save[1].toLowerCase() !== adapted.defense.statistic) return null;
    const same = (component, formula, type) => String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type;
    if (!same(components[0], breath[3], breath[4]) || !same(components[1], breath[5], breath[6])) return null;
    const step = STEP.exec(rest[0]);
    if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && adapted.heightening.damage?.[components[0].id] === step[2] && step[3] === breath[4] && adapted.heightening.damage?.[components[1].id] === step[4] && step[5] === breath[6])) return null;
    return {
        html: `<p>Each creature in the area takes ${breath[3]} ${breath[4]} damage and ${breath[5]} ${breath[6]} damage (basic ${save[1]} save).</p>`,
        repeatable: { window: "duration", actions: actions[1] === "two" ? 2 : 3, recharge: { formula: recharge[1] ?? recharge[2], unit: "rounds" },
            gate: { kind: "counteract", target: counter[1].replace(/^the /, ""), text: `${sentences[at]} ${sentences[at + 1]}` }, sourceText: sentences[at + 1] },
        sentences: [...sentences.slice(at), htmlToPlainText(rest[0]).trim()]
    };
}
