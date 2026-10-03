// A placed area that only conceals (no save, no damage): Mist.
//   "You call forth a cloud of mist." / "All creatures within the mist become Concealed, and all creatures outside the mist become concealed
//   to creatures within it." / "You can Dismiss the cloud."
// Casting places the area and starts the lingering cloud (startCloud): creatures inside are Concealed, with the flat-check note for creatures
// outside, synced as they move; the caster can Dismiss it (Ongoing spells' End).
import { htmlToPlainText } from "./description-parser.js";

const CONCEAL = /^All creatures within the (?:area of the )?([a-z]+) become (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}|concealed), and all creatures outside the ([a-z]+) become concealed to creatures within it\.$/;
const DISMISS = /^You can Dismiss the ([a-z]+)\.$/;
// Quicken Time: "…; creatures inside the area are Concealed to those outside it, and vice versa." (a clause of narration before it) and "Any
// creature that begins its turn in the area is Quickened until the end of its turn and can use the extra action only to Stride or Strike." — the
// condition on each creature as its turn starts inside, until that turn ends (the extra action's limit is the note's).
const VICE_VERSA = /^(?:[A-Z][^;\d@]{10,240}; )?creatures inside the area are (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Concealed\}|Concealed) to those outside it, and vice versa\.$/i;
const TURN_CONDITION = /^Any creature that begins its turn in the area is @UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+)\]\{(Quickened)\} until the end of its turn and can use the extra action only to ([A-Z][a-z]+) or ([A-Z][a-z]+)\.$/;
// Confetti Cloud: "Additionally, creatures in the area of the confetti continually hear the raucous sounds of a party or festival and take a
// –2 circumstance penalty on Perception checks to hear." — a toggled Perception modifier on the in-area Effect (the roller switches it on for
// a check to hear).
const HEARING = /^Additionally, creatures in the area of the [a-z]+ [a-z ,]{3,100}? and take a [–−-](\d) (circumstance|status) penalty on Perception checks to hear\.$/;
// "The number of actions you spend when Casting this Spell determines its area." with "<1/2/3> (…) The spell's area is a @Template[burst|distance:N]."
const BY_ACTIONS = /^The number of actions you spend when Casting this Spell determines its area\.$/;
const ACTION_AREA = /^<p>\s*<span class="action-glyph">([123])<\/span>\s*\([a-z, ]+\)\s*The spell's area is a @Template\[burst\|distance:(\d+)\]\.\s*<\/p>$/;
// Dust Storm: "Creatures entering or starting their turn in the dust storm take 1d6 slashing damage." with "Creatures that have the water trait or
// that are made primarily of liquid take double damage." and "Heightened (+2) The damage increases by 1d6.": the area deals the damage itself as a
// creature enters or starts its turn inside (double for the trait; "made primarily of liquid" is the GM's note), and the breathing rule is a note.
const HAZARD = /^Creatures entering or starting their turn in the ([a-z ]+) take (\d+)d(\d+) ([a-z]+) damage\.$/;
const DOUBLE_TRAIT = /^Creatures that have the ([a-z]+) trait or that are made primarily of liquid take double damage\.$/;
const BREATH = /^The [a-z]+ also makes the air unbreathable; creatures in the area must hold their breath, though wearing a scarf or similar clothing over the mouth increases the time the creature can hold its breath to (\d+) rounds\.$/;
const HAZARD_STEP = /^<p>\s*<strong>\s*Heightened \(\+(\d)\)\s*<\/strong>\s*The damage increases by (\d+)d(\d+)\.\s*<\/p>$/;
const NARRATION_RULES = /\d|\[\[|\b(?:damage|saves?|bonus|penalty|conditions?|immune|Sustain|can't|must|each|terrain|rounds?|minutes?|concealed|hidden|invisible)\b/i;

/** Returns {concealingArea, claimed} or null. */
export function compileConcealingArea(adapted) {
    if (adapted.defense?.kind !== "none" || (adapted.damageComponents ?? []).length > 1 || String(adapted.targeting?.target ?? "").trim() || adapted.lifecycle?.sustained) return null;
    const area = adapted.targeting?.area;
    const duration = String(adapted.lifecycle?.duration ?? "").trim();
    const fixed = /^(\d+) (round|minute|hour)s?$/i.exec(duration);
    if (!fixed) return null;
    const durationSeconds = Number(fixed[1]) * { round: 6, minute: 60, hour: 3600 }[fixed[2].toLowerCase()];
    const [html, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    // (The hazard's own Heightened step is read below.)
    const hazardStep = rest.length === 1 && (adapted.damageComponents ?? []).length === 1 ? HAZARD_STEP.exec(rest[0]) : null;
    if (hazardStep) rest.length = 0;
    if (/Heightened/i.test(rest.join(" ")) || rest.length > 1) return null;
    // The area by actions: the three action paragraphs, and nothing else after the rule.
    const actionParagraphs = rest.length ? [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim()) : [];
    const sizes = actionParagraphs.length ? Object.fromEntries(actionParagraphs.map(paragraph => ACTION_AREA.exec(paragraph)).map(match => match ? [match[1], Number(match[2])] : [null, null])) : null;
    if (rest.length && (!sizes || Object.keys(sizes).join() !== "1,2,3")) return null;
    if (!sizes && (!area || !["burst", "cylinder", "cube"].includes(area.type) || !(Number(area.value) > 0))) return null;
    const sentences = htmlToPlainText(html).replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean);
    let conceal = null, dismissible = false, narrated = 0, hearing = null, byActions = false, turnCondition = null, hazard = null;
    const notes = [];
    const claimed = [];
    for (const sentence of sentences) {
        const hides = !conceal ? CONCEAL.exec(sentence) : null;
        if (hides) { conceal = hides[1]; claimed.push(sentence); continue; }
        if (!conceal && VICE_VERSA.test(sentence)) { conceal = "area"; claimed.push(sentence); continue; }
        const turn = !turnCondition ? TURN_CONDITION.exec(sentence) : null;
        if (turn) { turnCondition = { uuid: turn[1], name: turn[2], slug: turn[2].toLowerCase(), note: `${turn[2]} until the end of its turn; it can use the extra action only to ${turn[3]} or ${turn[4]}.`, sourceText: sentence };
            claimed.push(sentence); continue; }
        const hear = conceal && !hearing ? HEARING.exec(sentence) : null;
        if (hear) { hearing = { value: -Number(hear[1]), type: hear[2] }; claimed.push(sentence); continue; }
        if (conceal && sizes && BY_ACTIONS.test(sentence)) { byActions = true; claimed.push(sentence); continue; }
        if (conceal && /^You can Dismiss the spell\.$/.test(sentence)) { dismissible = true; claimed.push(sentence); continue; }
        // "You can Dismiss the cloud.": the spell's own noun, named earlier.
        const dismiss = DISMISS.exec(sentence);
        if (dismiss && conceal && new RegExp(`\\b${dismiss[1]}\\b`).test(sentences.slice(0, sentences.indexOf(sentence)).join(" "))) { dismissible = true; claimed.push(sentence); continue; }
        const hurts = conceal && !hazard ? HAZARD.exec(sentence) : null;
        if (hurts) { hazard = { count: Number(hurts[2]), faces: Number(hurts[3]), type: hurts[4] }; claimed.push(sentence); continue; }
        const doubled = hazard && !hazard.doubleTrait ? DOUBLE_TRAIT.exec(sentence) : null;
        if (doubled) { hazard.doubleTrait = doubled[1]; notes.push(`Creatures made primarily of liquid also take double damage (the module doubles it for creatures with the ${doubled[1]} trait; the GM doubles it for others).`); claimed.push(sentence); continue; }
        const breath = conceal && BREATH.exec(sentence);
        if (breath) { notes.push(`The air in the area is unbreathable: creatures inside must hold their breath (a scarf or similar clothing over the mouth lets a creature hold it for ${breath[1]} rounds).`); claimed.push(sentence); continue; }
        if (!conceal && narrated < 1 && !NARRATION_RULES.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!conceal || !!sizes !== byActions) return null;
    // The damage is the item's one entry, stepped by its own Heightened line.
    const [component] = adapted.damageComponents ?? [];
    if (!!component !== !!hazard || (hazard && (component.category || String(component.formula).replace(/\s+/g, "") !== `${hazard.count}d${hazard.faces}` || String(component.type).toLowerCase() !== hazard.type))) return null;
    if (hazard && hazardStep && Number(hazardStep[3]) !== hazard.faces) return null;
    if (hazard) hazard.step = hazardStep ? { interval: Number(hazardStep[1]), dice: Number(hazardStep[2]) } : null;
    if (hazard) hazard.baseRank = Number(adapted.rank) || 1;
    if (hazardStep) claimed.push(htmlToPlainText(hazardStep[0]).trim());
    const slug = String(adapted.source?.slug ?? adapted.source?.name ?? "spell").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    return { concealingArea: { area: sizes ? { type: "burst", value: sizes[2] } : { type: area.type, value: Number(area.value) }, ...(sizes ? { sizes } : {}), durationSeconds,
        ...(dismissible ? { dismissible: true } : {}),
        ...(turnCondition ? { turnCondition } : {}),
        ...(hazard ? { hazard } : {}), ...(notes.length ? { notes } : {}),
        // The in-area Effect's own rules: a toggle for "checks to hear", and the penalty it gates.
        ...(hearing ? { memberRules: [{ key: "RollOption", domain: "perception", option: `${slug}-hearing`, toggleable: true, label: "Perception check to hear" },
            { key: "FlatModifier", selector: "perception", type: hearing.type, value: hearing.value, predicate: [`${slug}-hearing`] }] } : {}) }, claimed };
}
