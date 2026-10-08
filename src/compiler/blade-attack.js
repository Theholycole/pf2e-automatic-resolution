// A conjured blade that attacks with a single action for the whole duration (Blazing Blade):
//   "While the spell lasts, you can use a single action, which has the attack and concentrate traits, to burn your foes with the blazing
//   blade." / "When you do, make a spell attack roll." / "On a success, the blazing blade deals 1d6 fire damage plus 1d6 spirit damage plus
//   your spellcasting ability modifier." / "On a critical success, it deals double the usual damage." with "Heightened (4th) The blade's fire
//   damage increases to 2d6. On a critical success, the target takes @Damage[(…)d6[persistent,spirit]] damage." (and 6th, 8th).
// Rewritten to an ordinary melee spell attack of the item's damage (PF2e's own roll: its heightened dice and the spellcasting modifier it adds),
// repeatable from the card with a single action any number of times while the spell lasts (window "duration"); from the first rank whose entry
// gives it, a critical hit also deals the entry's persistent damage (a heightened variant of the rows).
import { htmlToPlainText } from "./description-parser.js";
import { ruleValueAt } from "./effect-note-proof.js";
import { NARRATION_RULES_NO_TERRAIN as NARRATION_RULES } from "./text-patterns.js";

const WINDOW = /^While the spell lasts, you can use a single action, which has the attack and concentrate traits, to [a-z ]+ with the ([a-z ]+)\.$/;
const ROLL = /^When you do, make a spell attack roll\.$/;
const HIT = /^On a success, the ([a-z ]+) deals (\d+d\d+) ([a-z]+) damage plus (\d+d\d+) ([a-z]+) damage plus your spellcasting ability modifier\.$/;
const CRIT = /^On a critical success, it deals double the usual damage\.$/;
const ENTRY = /^<p>\s*<strong>\s*Heightened \((\d+)(?:st|nd|rd|th)\)\s*<\/strong>\s*The [a-z]+'s ([a-z]+) damage increases to (\d+d\d+)\. On a critical success, the target takes (@Damage\[(\([^\[\]]+\))d(\d+)\[persistent,([a-z]+)\]\]|(\d+)d(\d+) persistent ([a-z]+)) damage\.\s*<\/p>$/;

const plain = html => htmlToPlainText(String(html).replace(/<\/?em>/g, "")).replace(/\s+/g, " ").trim();

/** {html, criticalHtml, criticalFromRank, repeatable, sentences, entries} or null. */
export function extractBladeAttack(adapted) {
    if (adapted.defense?.kind !== "none" || !(adapted.activation?.traits ?? []).includes("attack") || String(adapted.targeting?.target ?? "").trim() || adapted.targeting?.area) return null;
    if (!/^\d+ minutes?$/i.test(String(adapted.lifecycle?.duration ?? "").trim()) || adapted.lifecycle?.sustained) return null;
    const components = adapted.damageComponents ?? [];
    if (components.length !== 2 || components.some(component => component.category)) return null;
    const [body, ...rest] = String(adapted.descriptionHTML ?? "").split(/<hr\s*\/?>/i).map(section => section.trim());
    if (rest.length !== 1) return null;
    const sentences = plain(body).split(/(?<=[.!?])\s+(?=[A-Z])/).map(sentence => sentence.trim()).filter(Boolean);
    const at = sentences.findIndex(sentence => WINDOW.test(sentence));
    if (at < 0 || at > 1 || sentences.length !== at + 4 || sentences.slice(0, at).some(sentence => NARRATION_RULES.test(sentence))) return null;
    const window = WINDOW.exec(sentences[at]), hit = HIT.exec(sentences[at + 2]);
    if (!ROLL.test(sentences[at + 1]) || !hit || !CRIT.test(sentences[at + 3]) || hit[1] !== window[1]) return null;
    // The item's two entries: the first die without the modifier, the second with it ("plus your spellcasting ability modifier").
    const [first, second] = components;
    const same = (component, formula, type) => String(component.formula).replace(/\s+/g, "") === formula && String(component.type).toLowerCase() === type;
    if (!same(first, hit[2], hit[3]) || !same(second, hit[4], hit[5]) || first.applyModifier === true || second.applyModifier !== true) return null;
    // Heightened: fixed ranks raising the first entry's dice (the item's own heightening) and a critical hit's persistent damage.
    const entries = [...rest[0].matchAll(/<p>[\s\S]*?<\/p>/gi)].map(match => match[0].trim());
    const levels = adapted.heightening?.type === "fixed" ? adapted.heightening.levels ?? adapted.heightening.damageByRank ?? null : null;
    if (!entries.length || !levels) return null;
    let inline = null, persistentType = null;
    const read = [];
    for (const entry of entries) {
        const found = ENTRY.exec(entry);
        if (!found || found[2] !== hit[3]) return null;
        const rank = Number(found[1]);
        const raised = levels[rank]?.damage?.[first.id]?.formula ?? levels[rank]?.[first.id];
        if (String(raised ?? "").replace(/\s+/g, "") !== found[3]) return null;
        const type = found[7] ?? found[10];
        if (persistentType && type !== persistentType) return null;
        persistentType = type;
        if (found[5]) { if (inline) return null; inline = { rank, formula: found[5], faces: Number(found[6]), text: found[4] }; }
        read.push({ rank, dice: found[5] ? null : Number(found[8]), faces: Number(found[6] ?? found[9]), text: plain(entry) });
    }
    // The inline roll is given at the first entry, and gives every later entry's dice at its rank.
    if (!inline || read[0].rank !== inline.rank || read.some(entry => entry.faces !== inline.faces || (entry.dice != null && ruleValueAt(inline.formula, entry.rank) !== entry.dice))) return null;
    if (ruleValueAt(inline.formula, inline.rank) !== 1) return null;
    const damage = `${hit[2]} ${hit[3]} damage and ${hit[4]} ${hit[5]} damage`;
    return {
        html: `<p>Make a melee spell attack roll against the target's AC. On a hit, the target takes ${damage} (double damage on a critical hit).</p>`,
        criticalHtml: `<p>Make a melee spell attack roll against the target's AC. On a hit, you deal ${damage}. On a critical hit, the target also takes ${inline.text} damage.</p>`,
        criticalFromRank: inline.rank,
        repeatable: { window: "duration", actions: 1, traits: ["attack", "concentrate"], sourceText: sentences[at] },
        sentences: sentences.slice(at), entries: read.map(entry => entry.text)
    };
}
