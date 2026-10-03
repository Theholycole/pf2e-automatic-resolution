// A reaction resistance whose spell gives an action that ends it with a concealing cloud (Eat Fire):
//   "Trigger You would take fire damage." / "You gain resistance 5 to fire damage until the end of the current turn." / "During the remaining
//   duration of the spell, you can use the Belch Smoke action." / "The spell ends if you fall Unconscious, inhale, or exhale (this includes
//   speaking)." / "Belch Smoke [one-action] You exhale what remains of the smoke, ending the spell and creating a smoke cloud in a
//   @Template[burst|distance:5] within 20 feet. All creatures within the smoke cloud are Concealed, and all other creatures are concealed to them.
//   The smoke lasts for 1 minute or until dispersed by a strong wind." with "Heightened (+3) The resistance increases by 5." and PF2e's Effect
//   (Resistance 5*ceil(rank/3), 1 round).
// Casting applies PF2e's Effect to the caster for the spell's duration (its Resistance rule moved to a second Effect that ends with the current
// turn, as the text says); both end when the caster falls Unconscious. The card's action button places the burst within range, starts a lingering concealment
// area for its duration (creatures inside are Concealed, with the flat-check note for those outside), and ends the Effect. Inhaling, exhaling
// and a strong wind are notes.
import { htmlToPlainText } from "./description-parser.js";

const TRIGGER = /^<p>\s*<strong>\s*Trigger\s*<\/strong>\s*You would take ([a-z]+) damage\.\s*<\/p>$/;
const RESIST = /^You gain resistance (\d+) to ([a-z]+) damage until the end of the current turn\.$/;
const ACTION = /^During the remaining duration of the spell, you can use the ([A-Z][a-z]+(?: [A-Z][a-z]+)*) action\.$/;
const ENDS = /^The spell ends if you fall @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Unconscious\}, inhale, or exhale \(this includes speaking\)\.$/;
const CLOUD = /^You exhale what remains of the ([a-z]+), ending the spell and creating a ([a-z]+) cloud in a @Template\[burst\|distance:(\d+)\] within (\d+) feet\.$/;
const CONCEALED = /^All creatures within the ([a-z]+) cloud are @UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}, and all other creatures are concealed to them\.$/;
const LASTS = /^The ([a-z]+) lasts for (\d+) minutes? or until dispersed by a strong wind\.$/;
const HEIGHTENED = /^<p>\s*<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The resistance increases by (\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|@|\[\[|\b(?:saves?|bonus|penalty|conditions?|immune|resistance|Sustain|can't|must|each|until|rounds?|minutes?)\b/i;
const split = text => htmlToPlainText(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);

/** Returns {cloudAction, claimed} or null. */
export function compileCloudAction(adapted, nativeSpellEffects) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length || !/^reaction$/i.test(String(adapted.activation?.time ?? "").trim())) return null;
    if (String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area || !/^until the end of your next turn$/i.test(String(adapted.lifecycle?.duration ?? "").trim())) return null;
    const links = [...(nativeSpellEffects?.unscoped ?? []), ...(nativeSpellEffects?.onUse ?? [])];
    if (links.length !== 1 || links[0].resolutionStatus !== "resolved") return null;
    const sections = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (sections.length !== 3) return null;
    const trigger = TRIGGER.exec(sections[0]);
    const paragraphs = [...sections[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)].map(match => match[1].trim());
    const heightened = HEIGHTENED.exec(sections[2]);
    if (!trigger || !heightened || paragraphs.length !== 3 || !/^@UUID\[Compendium\.pf2e\.spell-effects\.[^\]]+\]\{[^}]+\}$/.test(paragraphs[1])) return null;
    const body = split(`<p>${paragraphs[0]}</p>`);
    const at = body.findIndex(sentence => RESIST.test(sentence));
    if (at < 0 || at > 1 || body.length !== at + 3 || body.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const resist = RESIST.exec(body[at]), action = ACTION.exec(body[at + 1]);
    if (!action || !ENDS.test(body[at + 2]) || resist[2] !== trigger[1]) return null;
    // The action's paragraph: its name and one action, then the cloud.
    const head = new RegExp(`^<strong>\\s*${action[1]}\\s*<\\/strong>\\s*<span class="action-glyph">1<\\/span>\\s*`).exec(paragraphs[2]);
    if (!head) return null;
    const cloudSentences = split(`<p>${paragraphs[2].slice(head[0].length)}</p>`);
    const cloud = CLOUD.exec(cloudSentences[0] ?? ""), concealed = CONCEALED.exec(cloudSentences[1] ?? ""), lasts = LASTS.exec(cloudSentences[2] ?? "");
    if (cloudSentences.length !== 3 || !cloud || !concealed || !lasts || cloud[2] !== concealed[1] || cloud[1] !== lasts[1]) return null;
    // PF2e's Effect: exactly the resistance, at the stated value and step.
    const rules = links[0].document?.mechanics?.rules ?? links[0].document?.rules ?? [];
    const step = Number(heightened[1]), perStep = Number(heightened[2]);
    if (rules.length !== 1 || rules[0].key !== "Resistance" || rules[0].type !== resist[2] || String(rules[0].value).replace(/\s+/g, "") !== `${perStep}*ceil((@item.level)/${step})` || Number(resist[1]) !== perStep) return null;
    return {
        cloudAction: {
            effect: { uuid: links[0].uuid, label: links[0].label ?? links[0].reference }, resistance: { type: resist[2], value: Number(resist[1]), perStep, step },
            endsOnCondition: "unconscious", action: { name: action[1], actions: 1 },
            cloud: { name: `${cloud[2]} cloud`, area: { type: "burst", value: Number(cloud[3]) }, rangeFeet: Number(cloud[4]), durationSeconds: Number(lasts[2]) * 60 },
            notes: ["The spell also ends if the caster inhales or exhales (this includes speaking): delete the Effect.", `The ${cloud[2]} ends early if a strong wind disperses it: end it in Ongoing spells.`],
            // "until the end of the current turn" (user decision: the text): the resistance is its own Effect ending with the current turn;
            // PF2e's Effect (without its Resistance rule) is the spell for its duration.
            resistanceEffect: { ruleIndex: 0, rule: { key: "Resistance", type: resist[2], value: rules[0].value }, expiry: "current-turn" }
        },
        claimed: [trigger[0], ...body, ...cloudSentences, heightened[0]]
    };
}

export function isExecutableCloudAction(data) {
    return Boolean(data) && typeof data.effect?.uuid === "string" && typeof data.action?.name === "string" && data.cloud?.area?.type === "burst" && Number.isInteger(data.cloud.area.value)
        && Number.isInteger(data.cloud.rangeFeet) && Number.isInteger(data.cloud.durationSeconds) && data.cloud.durationSeconds > 0;
}
