// A placed area whose occupants hold PF2e's Effect, and that heals the living creatures who stay for its whole duration (Gentle Breeze):
//   "Medicine checks attempted to benefit living creatures in the area get a +2 status bonus." / "Any living creature in the area also gets a
//   +2 status bonus to saving throws against afflictions and, if it remains within the area for the full duration, regains 10 Hit Points." /
//   "In addition, the cool breeze reduces the temperature effects of heat by one step for any creature in the area." with "Heightened (+2) The
//   healing increases by 10 Hit Points." and PF2e's Effect (the two modifiers).
// Casting places the area and starts a lingering record for the duration: each creature inside holds PF2e's Effect, lost on leaving. PF2e's
// Medicine modifier waits on a roll option nothing sets ("benefit-creature"): the module adds the toggle. When the duration runs out, each
// living creature that was inside from the cast to the end regains the Hit Points. The heat is the GM's (a note).
import { htmlToPlainText } from "./description-parser.js";

const MEDICINE = /^Medicine checks attempted to benefit living creatures in the area get a \+(\d) status bonus\.$/;
const SAVES = /^Any living creature in the area also gets a \+(\d) status bonus to saving throws against afflictions and, if it remains within the area for the full duration, regains (\d+) Hit Points\.$/;
const HEAT = /^In addition, the cool breeze reduces the temperature effects of heat by one step for any creature in the area\.$/;
const STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The healing increases by (\d+) Hit Points\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|until|Hit Points|regains?)\b/i;

/** Returns {areaBoon, claimed} or null. */
export function compileAreaBoon(adapted, nativeSpellEffects) {
    const area = adapted.targeting?.area;
    if (adapted.defense?.kind !== "none" || area?.type !== "burst" || adapted.lifecycle?.sustained || String(adapted.targeting?.target ?? "").trim()) return null;
    const minutes = /^(\d+) minutes?$/i.exec(String(adapted.lifecycle?.duration ?? "").trim());
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (!minutes || links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || !/^\d+$/.test(String(components[0].formula).trim()) || !(components[0].kinds ?? []).includes("healing")) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    if (paragraphs.length !== 2 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1]) || rest.length !== 1) return null;
    const sentences = htmlToPlainText(`<p>${paragraphs[0]}</p>`).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => MEDICINE.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 3 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const medicine = MEDICINE.exec(sentences[at]), saves = SAVES.exec(sentences[at + 1]);
    if (!saves || !HEAT.test(sentences[at + 2]) || Number(saves[2]) !== Number(components[0].formula)) return null;
    // "Heightened (+2) The healing increases by 10 Hit Points.": the item's own step.
    const step = STEP.exec(rest[0]);
    if (!step || !(adapted.heightening?.type === "interval" && Number(adapted.heightening.interval) === Number(step[1])
        && String(adapted.heightening.damage?.[components[0].id] ?? "").trim() === step[2])) return null;
    // PF2e's Effect: exactly the two modifiers.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const medic = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "medicine" && rule.type === "status" && rule.value === Number(medicine[1])
        && JSON.stringify(rule.predicate) === JSON.stringify(["benefit-creature", "target:mode:living"]));
    const save = rules.findIndex(rule => rule.key === "FlatModifier" && rule.selector === "saving-throw" && rule.type === "status" && rule.value === Number(saves[1])
        && JSON.stringify([...(rule.predicate ?? [])].sort()) === JSON.stringify(["item:type:affliction", "self:mode:living"]));
    if (rules.length !== 2 || medic < 0 || save < 0) return null;
    return {
        areaBoon: {
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, area: { type: "burst", value: Number(area.value) }, durationSeconds: Number(minutes[1]) * 60,
            // ("to benefit living creatures": the medic's toggle, since nothing in PF2e sets the option.)
            ruleAdditions: [{ key: "RollOption", domain: "medicine", option: "benefit-creature", toggleable: true, label: "Medicine check to benefit a living creature in the area" }],
            stayHealing: { amount: Number(saves[2]), interval: Number(step[1]), add: Number(step[2]), living: true, sourceText: sentences[at + 1] },
            notes: [`${sentences[at + 2]} (Adjust the heat's temperature effects for creatures inside.)`]
        },
        claimed: [...sentences.slice(at), htmlToPlainText(rest[0]).trim()]
    };
}

/** The healing at a cast rank. */
export function areaBoonHealing(boon, castRank, baseRank) {
    return boon.stayHealing.amount + boon.stayHealing.add * Math.max(0, Math.floor((Number(castRank) - Number(baseRank)) / boon.stayHealing.interval));
}
