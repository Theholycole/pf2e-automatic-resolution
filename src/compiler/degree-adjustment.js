// Creature-dependent degree adjustments stated before a save's degree table:
// "Water creatures and plant creatures use the outcome one degree of success
// worse than the result of their saving throw." Trait forms are evaluated from
// PF2e traits; fuzzy creature states become a GM question per target. Each
// sentence must match exactly; the map is kept as written.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";
import { BETTER, WORSE } from "./text-patterns.js";

const TRAIT_WORDS = { water: "water", plant: "plant", air: "air", fire: "fire", earth: "earth", metal: "metal", wood: "wood", undead: "undead" };

// "X creatures and Y creatures", "Creatures made of X (such as X elementals) and Y creatures",
// "Creatures with the X or Y traits".
function traitSubject(subject) {
    const text = subject.trim();
    let match = /^([A-Za-z]+) creatures(?: and ([a-z]+) creatures)?$/i.exec(text);
    if (match) return [match[1], match[2]].filter(Boolean).map(word => TRAIT_WORDS[word.toLowerCase()]);
    match = /^Creatures made of ([a-z]+) \(such as \1 elementals\)(?: and ([a-z]+) creatures)?$/i.exec(text);
    if (match) return [match[1], match[2]].filter(Boolean).map(word => TRAIT_WORDS[word.toLowerCase()]);
    match = /^creatures with the ([a-z]+)(?: or ([a-z]+))? traits?$/i.exec(text);
    if (match) return [match[1], match[2]].filter(Boolean).map(word => TRAIT_WORDS[word.toLowerCase()]);
    return null;
}

const SENTENCES = [
    // Uniform one-step shifts for a trait-defined subject.
    { pattern: /^(.+?) use the outcome (?:for )?one degree of success (worse|better) than the result of their saving throws?\.$/, uniform: true },
    { pattern: /^(.+?) attempting a save against this spell get a degree of success one (worse|better) than they rolled\.$/, uniform: true },
    // "Creatures with the water or plant traits get a result one degree of success worse than they rolled." (Dehydrate)
    { pattern: /^(.+?) get a result one degree of success (worse|better) than they rolled\.$/, uniform: true }
];

/** Parch form: a trait read from PF2e, or a described body the GM confirms. */
const TRAIT_OR_DESCRIBED = /^The target must attempt a (?:Fortitude|Reflex|Will) save; if used on a creature that has the ([a-z]+) trait or (a creature [^;,]+?(?: \(such as [^)]+\))?), the creature uses the outcome for one degree of success (worse|better) than the result\.$/;

/** Celestial Accord form: a creature in combat can't do worse than success (the GM confirms it's engaged in combat). */
const COMBAT_FLOOR = /^A creature currently engaged in combat can't get a result worse than success, and a target that is subject to hostility from any other creature ceases to be affected by [a-z' ]+\.$/;

/** Spiritual Anamnesis form: an explicit two-entry map for a described population. */
const EXPLICIT = /^This is especially disorienting for ([^;]+); if such creatures roll a critical success on their save, they get a success instead, and if they roll a failure, they get a critical failure instead\.$/;

/** Heat Metal form: a creature holding the targeted item can Release it for a result one step better (the GM confirms it does). */
// (PF2e 8.5 links the Release action; 8.6 writes it plain.)
const RELEASE_BETTER = /^If you target an item held by the creature, the creature can (?:@UUID\[Compendium\.pf2e\.actionspf2e\.Item\.[A-Za-z0-9]+\]\{Release\}|Release) the item to improve (?:their|its) degree of success by one step from the result of (?:their|its) saving throw\.$/;

/** Hypnopompic Terrors form: a sleeping target wakes as it saves, its result one step worse (the GM confirms it was asleep). */
const SLEEPING_WORSE = /^If you target a sleeping creature, it wakes up as it attempts the save but takes one degree of success worse than the result it rolled on its save\.$/;

/** Ordained Purpose form: a described creature's result one step worse or better ("At the GM's discretion, …" too) — the GM's per-target call. */
const DESCRIBED_SHIFT = /^(?:At the GM's discretion, )?(a creature [^.]+?) uses the outcome one degree of success (worse|better) than the result of its saving throw\.$/i;
// Kiss the Ring (PF2e 8.6): "Creatures that rank below you in a shared hierarchical organization treat the result of their Will save as one degree of success
// worse." — the GM's answer for each creature.
const RANK_SHIFT = /^Creatures that (rank below you in a shared hierarchical organization) treat the result of their (?:Fortitude|Reflex|Will) save as one degree of success (worse|better)\.$/;
const IDENTITY = { criticalSuccess: "criticalSuccess", success: "success", failure: "failure", criticalFailure: "criticalFailure" };

export function compileDegreeAdjustments(html) {
    const prefix = String(html ?? "").split(/<strong\b[^>]*>\s*(?:Critical Success|Success|Failure|Critical Failure)\s*<\/strong>/i)[0];
    const sentences = htmlToPlainText(stripHeighteningHTML(prefix)).split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    const adjustments = [];
    for (const sentence of sentences) {
        for (const form of SENTENCES) {
            const match = form.pattern.exec(sentence);
            if (!match) continue;
            const traits = traitSubject(match[1]);
            if (!traits || traits.some(trait => !trait)) return { ambiguous: true, sentence };
            adjustments.push({ predicate: { kind: "trait-any", traits }, map: { ...(match[2] === "worse" ? WORSE : BETTER) }, sourceText: sentence });
        }
        const described = TRAIT_OR_DESCRIBED.exec(sentence);
        if (described) {
            const trait = TRAIT_WORDS[described[1].toLowerCase()];
            if (!trait) return { ambiguous: true, sentence };
            adjustments.push({ predicate: { kind: "trait-or-gm-confirmed", traits: [trait], question: `Is this ${described[2]}?` },
                map: { ...(described[3] === "worse" ? WORSE : BETTER) }, sourceText: sentence });
        }
        if (COMBAT_FLOOR.test(sentence)) adjustments.push({
            predicate: { kind: "gm-confirmed", question: "Is this creature currently engaged in combat? If so, its result can't be worse than success." },
            map: { criticalSuccess: "criticalSuccess", success: "success", failure: "success", criticalFailure: "success" },
            sourceText: sentence
        });
        if (SLEEPING_WORSE.test(sentence)) adjustments.push({
            predicate: { kind: "gm-confirmed", question: "Is this creature asleep? If so, it wakes up (remove its Unconscious) and its result is one step worse." },
            map: { ...WORSE }, sourceText: sentence
        });
        if (RELEASE_BETTER.test(sentence)) adjustments.push({
            predicate: { kind: "gm-confirmed", question: "Is the target an item this creature holds, and does it Release the item? If so, its result is one step better." },
            map: { ...BETTER }, sourceText: sentence
        });
        const ranked = RANK_SHIFT.exec(sentence);
        if (ranked) adjustments.push({ predicate: { kind: "gm-confirmed", question: `Does this creature ${ranked[1].replace(/\byou\b/, "the caster")}? If so, its result is one step ${ranked[2]}.` },
            map: { ...(ranked[2] === "worse" ? WORSE : BETTER) }, sourceText: sentence });
        const explicit = EXPLICIT.exec(sentence);
        if (explicit) adjustments.push({
            predicate: { kind: "gm-confirmed", question: `Does this apply: ${explicit[1].trim()}?` },
            map: { criticalSuccess: "success", success: "success", failure: "criticalFailure", criticalFailure: "criticalFailure" },
            sourceText: sentence
        });
    }
    // A worse and a better shift for two described creatures: one question per target with three answers (worse, better, neither).
    const described = sentences.map(sentence => DESCRIBED_SHIFT.exec(sentence)).filter(Boolean);
    if (described.length === 2 && !adjustments.length && described[0][2].toLowerCase() !== described[1][2].toLowerCase()) {
        const option = match => ({ key: match[2].toLowerCase(), label: `One degree ${match[2].toLowerCase()} (${match[1]})`, map: { ...(match[2].toLowerCase() === "worse" ? WORSE : BETTER) } });
        return { predicate: { kind: "gm-choice", question: "Does either described creature apply to this one?", options: described.map(option) }, map: { ...IDENTITY },
            sourceText: described.map(match => match[0]).join(" "), claimed: described.map(match => match[0]) };
    }
    if (described.length === 1 && !adjustments.length) return { predicate: { kind: "gm-confirmed", question: `Is this ${described[0][1].replace(/^a creature/i, "a creature")}?` },
        map: { ...(described[0][2].toLowerCase() === "worse" ? WORSE : BETTER) }, sourceText: described[0][0] };
    if (described.length) return { ambiguous: true };
    return adjustments.length === 1 ? adjustments[0] : adjustments.length ? { ambiguous: true } : null;
}

