// A condition chosen for each target by its highest attribute modifier, with the value from the row (Jealous Hex):
//   "The target is cursed with an adverse condition depending on its highest attribute modifier: Strength (Enfeebled);
//   Dexterity (Clumsy); Constitution (Drained); or Intelligence, Wisdom, or Charisma (Stupefied). On a tie, the creature
//   decides which of the conditions associated with the tied attributes to take." with rows "The condition's value is 1."
// Optionally "At the start of each of your turns, the target can attempt another Will save, ending the effect on a
// success." The conditions last the spell's fixed duration. Each row gets the options marked `choiceGroup: "attribute"`.
import { htmlToPlainText } from "./description-parser.js";

const ATTRIBUTES = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };
const LEAD = /^The target is cursed with an adverse condition depending on its highest attribute modifier: (.+)\.$/;
const TIE = /^On a tie, the creature decides which of the conditions associated with the tied attributes to take\.$/;
const RECUR = /^At the start of each of your turns, the target can attempt another (Fortitude|Reflex|Will) save, ending the effect on a success\.$/;
const VALUE = /^The condition's value is (\d+)\.?$/;
const CONDITION = /@UUID\[(Compendium\.pf2e\.conditionitems\.Item\.[^\]]+)\]\{([A-Za-z-]+)\}/;

const plain = html => htmlToPlainText(String(html ?? "")).replace(/\s+/g, " ").trim();
const sentences = text => text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);

export function compileAttributeCondition(plan, preambleHTML, adapted) {
    const raw = String(preambleHTML ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const text = sentences(raw);
    const leadIndex = text.findIndex(sentence => LEAD.test(sentence));
    if (leadIndex < 0 || !TIE.test(text[leadIndex + 1] ?? "")) return null;
    // "Strength (@UUID[…]{Enfeebled}); Dexterity (…); …; or Intelligence, Wisdom, or Charisma (…)"
    const options = [];
    for (const part of LEAD.exec(text[leadIndex])[1].split(/;\s*(?:or\s+)?/)) {
        const match = /^((?:[A-Z][a-z]+(?:, | or |, or )?)+) \((@UUID\[[^\]]+\]\{[^}]+\})\)$/.exec(part.trim());
        const link = match && CONDITION.exec(match[2]);
        if (!link) return null;
        const attributes = match[1].split(/, or |, | or /).map(name => ATTRIBUTES[name.toLowerCase()]);
        if (attributes.some(attribute => !attribute)) return null;
        options.push({ slug: link[2].toLowerCase(), uuid: link[1], name: link[2], attributes });
    }
    const covered = options.flatMap(option => option.attributes);
    if (covered.length !== 6 || new Set(covered).size !== 6 || new Set(options.map(option => option.slug)).size !== options.length) return null;
    const recur = RECUR.exec(text[leadIndex + 2] ?? "") ?? text.map(sentence => RECUR.exec(sentence)).find(Boolean) ?? null;
    if (recur && recur[1].toLowerCase() !== adapted.defense.statistic) return null;
    const spell = plan.lifecycle.durationSpec;
    if (spell?.mode !== "fixed") return null;
    const rows = {};
    for (const degree of ["success", "failure", "criticalFailure"]) {
        const row = plain(plan.resolution.outcomes[degree]?.rawText);
        const value = VALUE.exec(row);
        if (value) { rows[degree] = { value: Number(value[1]), claims: [row] }; continue; }
        if (!/^The (?:target|creature) is unaffected\.$/.test(row)) return null;
    }
    if (!Object.keys(rows).length) return null;
    for (const [degree, row] of Object.entries(rows)) {
        const outcome = plan.resolution.outcomes[degree];
        outcome.effects = options.map(option => ({ kind: "condition", slug: option.slug, name: option.name, reference: option.uuid, raw: option.name, value: row.value,
            duration: { mode: "fixed", value: Number(spell.value), unit: spell.unit, expiry: spell.expiry ?? null, anchor: "effect-start", sourceText: "the spell's duration" },
            choiceGroup: "attribute", attributes: [...option.attributes],
            ...(recur ? { recurringSave: { timing: "caster-turn-start", mode: "end", statistic: recur[1].toLowerCase(), sourceText: recur[0] } } : {}) }));
        outcome.conditionRollClaims = row.claims;
    }
    return { attributeCondition: { options: options.map(({ slug, attributes }) => ({ slug, attributes })), tie: "creature-decides" },
        sentences: [text[leadIndex], text[leadIndex + 1], ...(recur ? [recur[0]] : [])] };
}
