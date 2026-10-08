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

// A reaction adding to a creature's bleed (Magic+'s Siphoning Rivulet): "Trigger A creature within range takes persistent bleed damage" / "The target increases
// the triggering bleed damage by 4d4, and you gain temporary Hit Points equal to the total bleed damage they took that lasts until the end of your next turn."
// / "Heightened (+1) The damage increases by 1d4." PF2e's entry is persistent bleed, but the text adds to the bleed taken this once: the text's dice as bleed
// damage now (heightened as its entry says); the caster's temporary Hit Points the triggering bleed (the caster gives it) plus what this dealt, until the end
// of its next turn.
const BLEED_TRIGGER = /^Trigger A creature within range takes persistent bleed damage\.?$/;
const BLEED_ADDS = /^The target increases the triggering bleed damage by (\d+)d(\d+), and you gain temporary Hit Points equal to the total bleed damage they took that lasts until the end of your next turn\.$/;
const BLEED_STEP = /^Heightened \(\+(\d+)\) The damage increases by (\d+)d(\d+)\.$/;
function compileBleedSiphon(adapted) {
    const components = adapted.damageComponents ?? [];
    const [trigger, body, heightened, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\b[^>]*>/i).map(part => htmlToPlainText(part).replace(/\s+/g, " ").trim());
    if (rest.length || !BLEED_TRIGGER.test(trigger ?? "") || components.length !== 1 || components[0].category !== "persistent" || String(components[0].type).toLowerCase() !== "bleed") return null;
    const sentences = String(body ?? "").split(/(?<=[.!?])\s+(?=[A-Z@])/).filter(Boolean);
    const adds = BLEED_ADDS.exec(sentences.at(-1) ?? "");
    if (!adds || sentences.length > 2 || (sentences.length === 2 && RULE_WORDS.test(sentences[0].replace(/\bthe target's blood\b/, "")))) return null;
    if (String(components[0].formula).replace(/\s+/g, "") !== `${adds[1]}d${adds[2]}`) return null;
    const step = BLEED_STEP.exec(heightened ?? ""), data = adapted.heightening;
    if (heightened && (!step || step[3] !== adds[2] || data?.type !== "interval" || Number(data.interval) !== Number(step[1]) || String(data.damage?.[components[0].id] ?? "").replace(/\s+/g, "") !== `${step[2]}d${step[3]}`)) return null;
    const baseRank = Number(adapted.rank) || 1;
    const formula = step ? `(${adds[1]}+floor((@item.rank - ${baseRank})/${Number(step[1])})*${Number(step[2])})d${adds[2]}[bleed]` : `${adds[1]}d${adds[2]}[bleed]`;
    return { damage: { recipient: "target", count: 1, sourceText: sentences.at(-1), formula, immediate: true, siphon: { plusTriggering: "bleed", rounds: 1, expiry: "turn-end" },
        dataNote: "PF2e's entry is persistent bleed; the text adds to the triggering bleed this once, so it's rolled as bleed damage now.",
        notes: [`Trigger: ${trigger.replace(/^Trigger /, "").replace(/\.?$/, ".")}`] } };
}

// A splash ring with no save (Dynamic Caustic Blast's three-action "Splash" variant, glyph-versions.js): "Each creature within 10 feet of the burst (but not in it)
// takes 2 acid splash damage." — the variant's splash entry, heightened by its data's step, on each creature the caster targets.
const SPLASH_RING = /^Each creature within (\d+) feet of the burst \(but not in it\) takes (\d+) ([a-z]+) splash damage\.$/;
function compileSplashRing(adapted) {
    const components = adapted.damageComponents ?? [];
    const ring = SPLASH_RING.exec(htmlToPlainText(String(adapted.descriptionHTML ?? "")).replace(/\s+/g, " ").trim());
    if (!ring || components.length !== 1 || components[0].category !== "splash" || String(components[0].formula).replace(/\s+/g, "") !== ring[2] || String(components[0].type).toLowerCase() !== ring[3]) return null;
    const heightening = adapted.heightening, step = heightening?.type === "interval" ? String(heightening.damage?.[components[0].id] ?? "").replace(/\s+/g, "") : "";
    if (heightening && !/^\d+$/.test(step)) return null;
    const baseRank = Number(adapted.rank) || 1;
    const formula = step ? `(${ring[2]}+floor((@item.rank - ${baseRank})/${Number(heightening.interval)})*${step})[splash,${ring[3]}]` : `${ring[2]}[splash,${ring[3]}]`;
    return { damage: { recipient: "target", count: null, any: true, sourceText: ring[0], formula, notes: [`Target each creature within ${ring[1]} feet of the burst but not in it.`] } };
}

export function compileDirectDamage(adapted) {
    if (adapted.defense?.kind && adapted.defense.kind !== "none") return null;
    if (adapted.targeting?.area) { const ring = compileSplashRing(adapted); if (ring) return ring; }
    if (/^the triggering creature$/i.test(String(adapted.targeting?.target ?? "").trim()) && /^reaction$/i.test(String(adapted.activation?.time ?? "").trim()) && !adapted.targeting?.area)
        return compileBleedSiphon(adapted);
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
