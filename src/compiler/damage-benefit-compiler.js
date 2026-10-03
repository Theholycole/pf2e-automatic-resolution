// Caster benefits derived from the damage a cast deals: temporary Hit Points
// equal to (half) the damage the target takes, to the most-damaged creature's
// damage, healing with excess as temporary Hit Points, or temporary Hit Points
// only when the spell kills. Every sentence must match exactly; the runtime
// computes amounts only from PF2e's confirmed damage receipts.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const UNIT = { minute: "minutes", minutes: "minutes", round: "rounds", rounds: "rounds" };
// ("(after applying resistances, weaknesses, and the like)": the damage after PF2e's IWR, which the receipts already are.)
const AFTER_IWR = String.raw`(?: \(after applying resistances?(?:, weaknesses,)? and the like\))?`;

const BENEFITS = [
    { kind: "temp-hp", aggregate: "single-target",
        pattern: new RegExp(String.raw`^You gain temporary Hit Points(?: for \d+ (?:minutes?|rounds?))? equal to (half )?the (?:([a-z]+) )?damage the target takes${AFTER_IWR}\.$`) },
    { kind: "temp-hp", aggregate: "max-target",
        pattern: /^You gain temporary Hit Points equal to (half )?the (?:([a-z]+) )?damage a single creature takes from this spell; calculate these temporary Hit Points using the creature that took the most damage\.$/ },
    { kind: "heal-then-temp", aggregate: "single-target",
        pattern: new RegExp(String.raw`^You regain Hit Points equal to (half )?the (?:([a-z]+) )?damage the target takes${AFTER_IWR}\.$`) },
    // "You gain temporary Hit Points equal to the total amount of HP the target loses, including the HP lost from becoming
    // Drained.": the target's Hit Points before the damage less those after its row (PF2e lowers them for Drained at once).
    { kind: "temp-hp", aggregate: "single-target", measure: "hp-lost",
        pattern: /^You gain temporary Hit Points equal to the total amount of HP the target loses, including the HP lost from becoming (?:@UUID\[Compendium\.pf2e\.conditionitems\.Item\.[A-Za-z0-9]+\]\{Drained\}|Drained)\.$/ },
    // "You gain temporary Hit Points equal to the damage the target takes, after resolving its save and applying a blood magic effect if
    // applicable." with "If the target's Hit Points were lower than the damage you dealt, you gain temporary Hit Points equal to their
    // remaining Hit Points instead.": the damage taken, at most the Hit Points the target had.
    { kind: "temp-hp", aggregate: "single-target", measure: "hp-capped", companion: /^If the target's Hit Points were lower than the damage you dealt, you gain temporary Hit Points equal to their remaining Hit Points instead\.$/,
        pattern: /^You gain temporary Hit Points equal to the damage the target takes, after resolving its save and applying a blood magic effect if applicable\.$/ },
    // "You gain 1d4 temporary Hit Points for every living creature in the line, as the roots transfer nutrients from those damaged into
    // you." (Life-Draining Roots): the dice once for each living creature among the targets in the area.
    { kind: "temp-hp", aggregate: "per-target", measure: "dice-per-living",
        pattern: /^You gain (\d+)d(\d+) temporary Hit Points for every living creature in the (?:line|cone|burst|emanation|area)(?:, as [a-z ,']+)?\.$/ },
    { kind: "temp-hp", aggregate: "single-target", condition: "target-killed", terminal: true,
        pattern: /^If (?:the target|the creature) is reduced to 0 Hit Points, it dies, and you gain temporary Hit Points equal to the damage dealt\.$/ }
];
const DURATIONS = [
    /^You lose any remaining temporary Hit Points after (\d+) (minutes?|rounds?)\.$/,
    /^(?:These|The) temporary Hit Points last for (\d+) (minutes?|rounds?)\.$/,
    /^Any temporary Hit Points gained through this spell are lost after (\d+) (minutes?|rounds?)\.$/,
    /^Any excess healing is gained as temporary Hit Points, which you lose after (\d+) (minutes?|rounds?)\.$/,
    // "You gain temporary Hit Points for 1 minute equal to half the piercing damage the target takes." (the benefit sentence states it)
    /^You gain temporary Hit Points for (\d+) (minutes?|rounds?) equal to [^.]+\.$/
];
// Whether a sentence is one this compiler reads (the spell-attack table keeps it in the preamble for it).
export function isDamageBenefitSentence(sentence) {
    return BENEFITS.some(entry => entry.pattern.test(sentence));
}

export function descriptionSentences(html) {
    return htmlToPlainText(stripHeighteningHTML(html)).split(/(?<=[.!?])\s+(?=[A-Z@])/)
        .map(sentence => sentence.trim()).filter(Boolean);
}

function singleTarget(targeting) {
    return /^(?:1|one) (?:living )?creatures?$/i.test(String(targeting?.target ?? "").trim()) && !targeting?.area;
}

/**
 * @returns {null | {ambiguous: true, reason} | {benefit, claimedSentences, terminal}}
 */
export function compileDamageBenefit(adapted) {
    const sentences = descriptionSentences(adapted.descriptionHTML);
    const mentions = sentences.filter(sentence => /\b(?:temporary Hit Points|regain Hit Points)\b/i.test(sentence));
    if (!mentions.length) return null;
    const benefits = sentences.flatMap(sentence => BENEFITS.filter(entry => entry.pattern.test(sentence))
        .map(entry => ({ ...entry, sentence, match: entry.pattern.exec(sentence) })));
    const durations = sentences.flatMap(sentence => DURATIONS.map(pattern => pattern.exec(sentence))
        .filter(Boolean).map(match => ({ sentence: match[0], value: Number(match[1]), unit: UNIT[match[2]] })));
    // Only the HP-lost benefit may state no duration: its temporary Hit Points last until used (an unlimited Effect).
    if (benefits.length !== 1 || durations.length > 1 || (durations.length === 0 && benefits[0].measure !== "hp-lost"))
        return { ambiguous: true, reason: "benefit-or-duration-not-unique" };
    const [benefit] = benefits, [duration = null] = durations;
    const companion = benefit.companion ? sentences.find(sentence => benefit.companion.test(sentence)) : null;
    if (benefit.companion && !companion) return { ambiguous: true, reason: "benefit-companion-missing" };
    const claimed = new Set([benefit.sentence, ...(companion ? [companion] : []), ...(duration ? [duration.sentence] : [])]);
    if (mentions.some(sentence => !claimed.has(sentence))) return { ambiguous: true, reason: "unclaimed-benefit-sentence" };
    if (benefit.kind === "heal-then-temp" !== /^Any excess healing\b/.test(duration?.sentence ?? "")) return { ambiguous: true, reason: "healing-overflow-mismatch" };

    // The stated damage type must be the cast's only structured damage.
    const components = adapted.damageComponents ?? [];
    const namedType = benefit.measure === "dice-per-living" ? null : benefit.match?.[2] ?? null;
    if (benefit.aggregate === "per-target" && !adapted.targeting?.area) return { ambiguous: true, reason: "area-required" };
    // "This deals 4d4 piercing damage and 4d4 void damage, …" with "… equal to the void damage the target takes (after applying resistances,
    // weaknesses, and the like)": one target, the named type's portion of the damage it takes (PF2e's record of its IWR, at runtime).
    const portion = benefit.aggregate === "single-target" && !benefit.measure && namedType && components.length > 1
        && components.every(component => !component.category && component.kinds?.includes("damage"))
        && components.filter(component => String(component.type).toLowerCase() === namedType.toLowerCase()).length === 1
        && new Set(components.map(component => String(component.type).toLowerCase())).size === components.length;
    if (!portion && (components.length !== 1 || components[0].category || !components[0].kinds?.includes("damage"))) return { ambiguous: true, reason: "damage-not-single-component" };
    if (!portion && namedType && namedType.toLowerCase() !== String(components[0].type).toLowerCase()) return { ambiguous: true, reason: "damage-type-mismatch" };
    if (benefit.aggregate === "single-target" && !singleTarget(adapted.targeting)) return { ambiguous: true, reason: "single-target-required" };
    if (benefit.aggregate === "max-target" && !adapted.targeting?.area) return { ambiguous: true, reason: "area-required" };
    return {
        benefit: {
            kind: benefit.kind,
            aggregate: benefit.aggregate,
            condition: benefit.condition ?? "always",
            fraction: benefit.measure !== "dice-per-living" && benefit.match?.[1] ? 0.5 : 1,
            damageType: portion ? namedType.toLowerCase() : String(components[0].type).toLowerCase(),
            ...(portion ? { portion: "type" } : {}),
            duration: duration ? { value: duration.value, unit: duration.unit } : null,
            ...(benefit.measure ? { measure: benefit.measure } : {}),
            ...(benefit.measure === "dice-per-living" ? { dice: { count: Number(benefit.match[1]), faces: Number(benefit.match[2]) } } : {}),
            sourceText: [...claimed]
        },
        terminal: benefit.terminal === true,
        claimedSentences: [...claimed]
    };
}
