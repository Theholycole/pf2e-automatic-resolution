// Strike spells whose rules are carried by PF2e Effects on the caster: "Make a melee Strike with a weapon you're
// holding, except that … any physical damage the weapon would deal is force damage instead." + Effect: Force Fling;
// "Make an unarmed Strike or Flurry of Blows … You gain a +1 status bonus to your attack rolls with the Strikes …"
// + Spell Effect: Inner Upheaval; "Make a melee Strike. If the Strike hits, you deal an additional 1d6 electricity
// damage and 1d6 sonic damage. After the attack, regardless of the result, your melee Strikes deal an additional 1
// electricity damage and 1 sonic damage …" + two Effects.
//
// The caster makes the Strike with PF2e; the Effects change it the way PF2e models the spell. Each Effect has a phase:
//   before — created on the caster when the spell is cast (it modifies the Strike);
//   after  — created once the caster's Strike is resolved ("After the attack, regardless of the result").
// With two Effects, each must be matched to its sentence by the damage it adds (DamageDice "1d6 electricity",
// FlatModifier "1 electricity"); the before-phase one then applies to that one Strike only and is removed once
// the Strike is resolved (its damage roll, or a miss). Anything the text says about other creatures (saves, areas,
// conditions on a target) is refused.
import { htmlToPlainText } from "./description-parser.js";
import { SPELL_EFFECT_LINK_ANY as EFFECT_LINK, RULE_WORDS_PLAIN as RULE_WORDS } from "./text-patterns.js";

const LINK = /@UUID\[[^\]]+\]\{[^}]+\}/g;
const STRIKE = /^Make an? (?:(?:melee|ranged|unarmed) )*Strike\b/;
const AFTER = /^After the attack, regardless of the result, /;
// Rules this route doesn't carry: other creatures' saves or conditions, areas, movement of others, healing.
const OTHERS = /\b(?:save|saving throw|@@\d+@@|each creature|all creatures|emanation|cone|burst|push|pull|teleport|regains?|Hit Points)\b|\bthe target (?:is|becomes|takes)\b/i;
// Results by degree ("Critical Success You gain …") or an ending the caster must keep up ("ends if … at the end of
// any turn in which you didn't hit") depend on the Strike's result; these Effects are applied regardless of it.
const RESULT_DEPENDENT = /\b(?:Critical Success|Critical Failure|Success|Failure)\b|\bends? (?:if|when)\b|\bat the end of any turn\b/;

/** "1d6 electricity" / "1 electricity" additions an Effect makes to Strike damage (at the spell's base rank). */
function damageAdditions(rules) {
    const out = [];
    for (const rule of rules ?? []) {
        const low = (rule.predicate ?? []).some(term => term && typeof term === "object" && (term.gte || term.gt));
        if (low) continue; // a heightened branch (e.g. "gte parent:origin:item:level 8") is the Heightened entry's
        if (rule.key === "DamageDice" && /^\d+$/.test(String(rule.diceNumber)) && /^d\d+$/.test(rule.dieSize ?? "") && /^[a-z]+$/.test(rule.damageType ?? ""))
            out.push(`${rule.diceNumber}${rule.dieSize} ${rule.damageType}`);
        if (rule.key === "FlatModifier" && Number.isInteger(rule.value) && /^[a-z]+$/.test(rule.damageType ?? "")) out.push(`${rule.value} ${rule.damageType}`);
    }
    return out;
}

export function compileStrikeEffects(adapted, nativeEffects) {
    if (adapted.defense?.kind !== "none" || adapted.targeting?.area || String(adapted.targeting?.target ?? "").trim()) return null;
    const requirements = String(adapted.activation?.requirements ?? "").trim().replace(/\.$/, "");
    const html = String(adapted.descriptionHTML ?? "").replace(/^\s*<p>\s*<strong>\s*Requirements\s*<\/strong>([^<]*)<\/p>\s*(?:<hr\s*\/?>)?/i,
        (all, stated) => requirements && stated.trim().replace(/\.$/, "") === requirements ? "" : all);
    const [base] = html.split(/(?=<hr\b[^>]*>\s*<p>\s*<strong>\s*Heightened\b)/i);
    const links = [];
    const masked = base.replace(LINK, link => `@@${links.push(link) - 1}@@`);
    const unmask = text => text.replace(/@@(\d+)@@/g, (_, index) => links[Number(index)]);
    let text = htmlToPlainText(masked).replace(/\s+/g, " ").trim();
    if (requirements && text.startsWith(`Requirements ${requirements}`)) text = text.slice(`Requirements ${requirements}`.length).replace(/^\.\s*/, "");
    // Consecutive link paragraphs ("@@0@@ @@1@@") are separate entries.
    const sentences = text.split(/(?<=[.!?)])\s+(?=[A-Z@])/).map(sentence => sentence.trim()).filter(Boolean)
        .flatMap(sentence => /^(?:@@\d+@@\s*)+$/.test(sentence) ? sentence.split(/\s+/) : [sentence]);
    const strikeIndex = sentences.findIndex(sentence => STRIKE.test(sentence));
    if (strikeIndex < 0 || sentences.slice(0, strikeIndex).some(sentence => RULE_WORDS.test(sentence))) return null;
    const effectLinks = [];
    const rules = [];
    for (const sentence of sentences.slice(strikeIndex)) {
        const unmasked = unmask(sentence);
        if (EFFECT_LINK.test(unmasked)) { effectLinks.push(unmasked); continue; }
        // A link to an action (Flurry of Blows) inside the Strike sentence is part of the Strike's choice.
        const linksHere = [...sentence.matchAll(/@@(\d+)@@/g)].map(match => links[Number(match[1])]);
        if (linksHere.some(link => !/Compendium\.pf2e\.(?:actionspf2e|classfeatures)\./.test(link))) return null;
        if (OTHERS.test(sentence.replace(/@@\d+@@/g, "")) || RESULT_DEPENDENT.test(sentence)) return null;
        rules.push(unmasked);
    }
    const entries = (nativeEffects.unscoped ?? []).concat(nativeEffects.onUse ?? []).filter(entry => effectLinks.includes(entry.sourceText));
    if (!effectLinks.length || effectLinks.length > 2 || entries.length !== effectLinks.length || entries.some(entry => entry.resolutionStatus !== "resolved")) return null;
    const after = rules.filter(rule => AFTER.test(rule));
    let phases;
    if (entries.length === 1) {
        if (after.length) return null; // one Effect can't be both the Strike's and the after-attack one
        phases = [{ entry: entries[0], phase: "before", removeAfterStrike: false }];
    } else {
        // Two Effects: each is matched by the damage it adds to the sentence that states it.
        const afterText = after.join(" ");
        const beforeText = rules.filter(rule => !AFTER.test(rule)).join(" ");
        // Every addition ("1d6 electricity", "1 electricity") must be named in the sentence ("1d6 electricity damage").
        const stated = (additions, sentence) => additions.length > 0
            && additions.every(addition => new RegExp(`(?:^|[^\\w])${addition.replace(" ", " ")}(?: damage)?\\b`).test(sentence));
        const classified = entries.map(entry => {
            const additions = damageAdditions(entry.document?.mechanics?.rules);
            const inAfter = stated(additions, afterText), inBefore = stated(additions, beforeText);
            return inAfter === inBefore ? null : { entry, phase: inAfter ? "after" : "before", removeAfterStrike: !inAfter };
        });
        if (classified.some(value => !value) || classified.filter(value => value.phase === "after").length !== 1) return null;
        phases = classified;
    }
    return {
        strike: { sourceText: unmask(sentences[strikeIndex]), rules },
        phases: phases.map(({ entry, phase, removeAfterStrike }) => ({ uuid: entry.uuid, label: entry.label, phase, removeAfterStrike, entry })),
        requiresConfiguration: phases.some(({ entry }) => entry.document?.automation?.requiresConfiguration === true)
    };
}
