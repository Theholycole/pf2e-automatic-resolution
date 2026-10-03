// Damage with no check: "It automatically hits and deals 1d4+1 force damage to the target." The spell's one damage entry,
// rolled with PF2e's own damage and applied to its one target. Anything else in the text (a range rule, a second target,
// a rider) leaves the spell to other compilers.
import { htmlToPlainText, stripHeighteningHTML } from "./description-parser.js";

const HITS = /^(?:It|The [a-z]+(?: of [a-z]+)?) automatically hits and deals (\d+d\d+(?:\s*\+\s*\d+)?) ([a-z]+) damage to the target\.$/;
// "You magically shift your weapon or unarmed attack into a spike of pure force that deals 1d4+1 force damage to a target within your
// melee reach." (no check; the reach is the GM's to confirm)
const REACH_HITS = /^You [a-z ,]+ that deals (\d+d\d+(?:\s*\+\s*\d+)?) ([a-z]+) damage to a target within your melee reach\.$/;
// "If you can use Spellstrike with a ranged weapon (…), you can instead target a creature in the first range increment of your ranged
// weapon.": a card reminder.
const SPELLSTRIKE_RANGE = /^If you can use Spellstrike with a ranged weapon(?: \([^)]*\))?, you can instead target a creature in the first range increment of your ranged weapon\.$/;
const RULE_WORDS = /\d|@|\[\[|\b(?:damage|save|saving throw|attack|bonus|penalty|condition|immune|resistance|weakness|target|creature|range|Sustain|Dismiss|can't|must|each|additional)\b/i;

// A reaction adding damage to an ally's critical Strike (Victory Cry): "Trigger An ally within range critically succeeds at a melee
// Strike." / "The weapon used to make the Strike deals an additional 1d6 sonic damage (not doubled due to the critical hit), and the ally
// can immediately attempt to Shove the creature struck, even if the ally's hands are full." The spell's damage is rolled on its own
// (not doubled) and applied to the creature struck, which the caster targets; the Shove and its bonuses are GM reminders.
const STRUCK_TRIGGER = /^Trigger An ally within range critically succeeds at a melee Strike\.$/;
const STRUCK = /^The weapon used to make the Strike deals an additional (\d+d\d+) ([a-z]+) damage \(not doubled due to the critical hit\), and the ally can immediately attempt to Shove the creature struck, even if the ally's hands are full\.$/;
const STRUCK_SHOVE = /^Your ally can use its item bonus to the triggering attack roll on the Athletics check, if any, and it gains a \+1 status bonus to the Athletics check if the triggering Strike was with a weapon that has the trip trait or an unarmed attack that has the trip trait\.$/;

// "Heightened (+2) The sonic damage increases by 1d6.": the text's damage heightened by that step (the item has no damage entry).
const TEXT_HEIGHTENED = /<strong>\s*Heightened \(\+(\d+)\)\s*<\/strong>\s*The ([a-z]+) damage increases by (\d+)d(\d+)\.\s*<\/p>/i;

function compileStruckDamage(adapted, sentences, component) {
    let trigger = false, rule = null, shove = null, narrated = 0;
    for (const sentence of sentences) {
        if (!trigger && STRUCK_TRIGGER.test(sentence)) { trigger = true; continue; }
        const struck = STRUCK.exec(sentence);
        if (struck && trigger && !rule) {
            if (component && (struck[1] !== String(component.formula).replace(/\s+/g, "") || struck[2] !== String(component.type).toLowerCase())) return null;
            rule = sentence; continue;
        }
        if (rule && !shove && STRUCK_SHOVE.test(sentence)) { shove = sentence; continue; }
        if (trigger && !rule && narrated < 1 && !RULE_WORDS.test(sentence)) { narrated++; continue; }
        return null;
    }
    if (!trigger || !rule) return null;
    // No damage entry: the text's dice, heightened as its Heightened entry says (and nothing else in it); a data note.
    let formula = null;
    if (!component) {
        const [, dice, die] = /^(\d+)d(\d+)$/.exec(STRUCK.exec(rule)[1]), type = STRUCK.exec(rule)[2];
        const blocks = String(adapted.descriptionHTML ?? "").split(/<hr\b[^>]*>/i).filter(block => /Heightened/.test(block));
        const heightened = TEXT_HEIGHTENED.exec(String(adapted.descriptionHTML ?? ""));
        if (blocks.length > 1 || (blocks.length && (!heightened || heightened[2] !== type || heightened[4] !== die || htmlToPlainText(blocks[0]).trim() !== htmlToPlainText(heightened[0]).trim()))) return null;
        const baseRank = Number(adapted.rank) || 1;
        formula = heightened ? `(${dice}+floor((@item.rank - ${baseRank})/${Number(heightened[1])})*${Number(heightened[3])})d${die}[${type}]` : `${dice}d${die}[${type}]`;
    }
    return { damage: { recipient: "target", count: 1, sourceText: rule, struck: true, ...(formula ? { formula, dataNote: "PF2e's item has no damage entry; the damage is the text's, at the cast rank." } : {}),
        notes: ["Target the creature the ally critically hit: it takes this damage (rolled on its own, not doubled).",
            "The ally can immediately attempt to Shove the creature struck, even if its hands are full.", ...(shove ? [shove] : [])] } };
}

export function compileDirectDamage(adapted) {
    if (adapted.defense?.kind && adapted.defense.kind !== "none") return null;
    if (/^the triggering ally$/i.test(String(adapted.targeting?.target ?? "").trim()) && /^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) && !adapted.targeting?.area) {
        const components = adapted.damageComponents ?? [];
        if (components.length > 1 || (components.length && (components[0].category || components[0].kinds?.join() !== "damage"))) return null;
        const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
        return compileStruckDamage(adapted, text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean), components[0] ?? null);
    }
    if (!/^[1-3]$/.test(String(adapted.activation?.time ?? "").trim())) return null;
    if (!/^(?:1|one) creature$/i.test(String(adapted.targeting?.target ?? "").trim()) || adapted.targeting?.area) return null;
    // (Spellstrike's text is a reminder, not a rule word.)
    const components = adapted.damageComponents ?? [];
    if (components.length !== 1 || components[0].category || components[0].kinds?.join() !== "damage") return null;
    const text = htmlToPlainText(stripHeighteningHTML(adapted.descriptionHTML)).replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1").replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z@])/).map(value => value.trim()).filter(Boolean);
    let rule = null, narrated = 0;
    const notes = [];
    for (const sentence of sentences) {
        const hits = HITS.exec(sentence) ?? REACH_HITS.exec(sentence);
        if (rule && SPELLSTRIKE_RANGE.test(sentence)) { notes.push(sentence); continue; }
        if (hits && !rule) {
            if (hits[1].replace(/\s+/g, "") !== String(components[0].formula).replace(/\s+/g, "") || hits[2] !== String(components[0].type).toLowerCase()) return null;
            rule = sentence; continue;
        }
        // One or two opening sentences of narration.
        // ("You briefly transform your attack into pure force energy …": what the caster's attack becomes, not a rule.)
        if (!rule && narrated < 2 && !RULE_WORDS.test(sentence.replace(/\byour attack\b/g, ""))) { narrated++; continue; }
        return null;
    }
    return rule ? { damage: { recipient: "target", count: 1, sourceText: rule, ...(REACH_HITS.test(rule) ? { reach: "melee" } : {}), ...(notes.length ? { notes } : {}) } } : null;
}
